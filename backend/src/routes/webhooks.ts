import { Router } from "express";
import express from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { sendAccessUnlockedEmail } from "../lib/emails";
import { createMagicLink } from "../lib/magic-link";
import type { Sport } from "../generated/prisma/enums";

// Type de l'event Stripe — inféré depuis `constructEvent` plutôt que
// d'importer le namespace Stripe (qui n'est pas exposé proprement
// par le SDK stripe-node 22 — l'entrée CJS n'exporte que le
// constructor). Évite le faux positif TS2694 "Namespace
// 'StripeConstructor' has no exported member 'Event'".
type StripeEvent = ReturnType<typeof stripe.webhooks.constructEvent>;

const router = Router();

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const QUARTER = 90 * DAY;

// Helper d'idempotence : log l'event Stripe comme traité. Reçoit soit
// le client prisma global, soit un client de transaction (tx) — les
// deux ont la même API pour stripeWebhookEvent.create. Le `payload`
// est stocké pour audit/dispute pendant ≥ 90j (fenêtre Stripe dispute).
async function markEventProcessed(
  client: Pick<typeof prisma, "stripeWebhookEvent">,
  event: StripeEvent,
): Promise<void> {
  await client.stripeWebhookEvent.create({
    data: {
      id: event.id,
      eventType: event.type,
      payload: event.data as unknown as Prisma.InputJsonValue,
    },
  });
}

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // 1. Vérification de signature : si invalide → 400. Stripe ne retry
    //    PAS en 400, ce qui est OK : un payload truqué ne deviendra
    //    pas magiquement valide au prochain retry.
    const sig = req.headers["stripe-signature"] as string;

    let event: StripeEvent;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err);
      res.status(400).send("Signature invalide");
      return;
    }

    // 2. Idempotence event-level : si on a déjà traité cet event,
    //    on skip et on répond 200 (Stripe stoppe les retries).
    const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });
    if (alreadyProcessed) {
      console.log(`[webhook] Event ${event.id} already processed, skipping`);
      res.json({ received: true });
      return;
    }

    // 3. Process event. PAS de try/catch global : si la logique métier
    //    échoue (DB down, contrainte unique, etc.), on laisse remonter
    //    → Express renvoie 500 → Stripe retry (jusqu'à 3 jours par
    //    défaut). Le markEventProcessed dans la transaction garantit
    //    qu'un succès est atomiquement enregistré, ou rien n'est
    //    enregistré (et Stripe retentera).
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      default:
        // Event qu'on n'a pas (encore) à traiter : on le marque comme
        // processed pour que Stripe ne le réenvoie pas en cas de retry
        // sur un endpoint sain. Couvre `invoice.payment_failed`,
        // `charge.dispute.created`, etc. qui seront ajoutés en Phase 2.
        await markEventProcessed(prisma, event);
        break;
    }

    res.json({ received: true });
  },
);

async function handleCheckoutSessionCompleted(
  event: StripeEvent,
): Promise<void> {
  // Le type réel est Stripe.Checkout.Session, mais le namespace n'est
  // pas exposé proprement — on lit les champs nécessaires via cast
  // ciblé. Les champs utilisés : id, metadata, subscription, customer_details.
  const session = event.data.object as {
    id: string;
    metadata: Record<string, string> | null;
    subscription: string | null;
    customer_details: { email: string | null } | null;
  };
  const metadata = session.metadata as Record<string, string>;
  const { userId, purpose } = metadata;

  // Accept both new and legacy `purpose` for backward-compat during
  // the tipster→expert rollout. Anciennes sessions Stripe créées
  // avant le rename portent encore "become_tipster".
  if (purpose === "become_expert" || purpose === "become_tipster") {
    const { pseudo, bio, sports: sportsJson } = metadata;
    const sports = JSON.parse(sportsJson) as Sport[];
    const stripeSubId = session.subscription as string;

    await prisma.$transaction(async (tx) => {
      // Application-level idempotence (defense in depth — l'event
      // table couvre déjà le replay Stripe).
      const existingExpert = await tx.expert.findUnique({
        where: { userId },
      });
      if (existingExpert) {
        await markEventProcessed(tx, event);
        return;
      }
      await tx.user.update({
        where: { id: userId },
        data: { role: "EXPERT" },
      });
      await tx.expert.create({
        data: {
          userId,
          pseudo,
          bio: bio || null,
          sports,
          subStatus: "ACTIVE",
          subExpiresAt: new Date(Date.now() + QUARTER),
          stripeSubId,
        },
      });
      await markEventProcessed(tx, event);
    });
    console.log(`[webhook] Expert created: ${pseudo} (user ${userId})`);
    return;
  }

  // User subscription (day pass / monthly).
  // expertId : nouveau nom de clé. Backward-compat avec tipsterId
  // pour les sessions Stripe pending pré-rename.
  const expertId = metadata.expertId || metadata.tipsterId;
  const { type } = metadata;

  // Resolve userId BEFORE transaction. User.email a une contrainte
  // unique → re-trying un user-create par email est idempotent.
  let resolvedUserId = metadata.userId;
  const email = metadata.email || session.customer_details?.email;

  if (!resolvedUserId && email) {
    const normalizedEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      user = await prisma.user.create({ data: { email: normalizedEmail } });
      console.log(`[webhook] User auto-created: ${normalizedEmail}`);
    }
    resolvedUserId = user.id;
  }

  if (!resolvedUserId) {
    // Impossible de faire progresser cet event. On le mark processed
    // pour éviter un retry storm sur un état non-récupérable.
    console.error(
      `[webhook] No userId/email in event ${event.id} (type=${event.type})`,
    );
    await markEventProcessed(prisma, event);
    return;
  }

  const stripeSubId =
    type === "MONTHLY" ? (session.subscription as string) : null;
  const expiresAt =
    type === "DAY_PASS"
      ? new Date(Date.now() + DAY)
      : new Date(Date.now() + MONTH);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({
      where: { stripeSessionId: session.id },
    });
    if (existing) {
      await markEventProcessed(tx, event);
      return;
    }
    await tx.subscription.create({
      data: {
        userId: resolvedUserId!,
        expertId,
        type: type as "DAY_PASS" | "MONTHLY",
        status: "ACTIVE",
        stripeSessionId: session.id,
        ...(stripeSubId ? { stripeSubId } : {}),
        expiresAt,
      },
    });
    await markEventProcessed(tx, event);
  });
  console.log(
    `[webhook] ${type} subscription created: user ${resolvedUserId} → expert ${expertId}`,
  );

  // Fire-and-forget email POST-transaction. Si l'envoi échoue,
  // l'erreur est loggée dans sendAccessUnlockedEmail mais on ne
  // rollback PAS la subscription (l'admin peut renvoyer le lien
  // manuellement plus tard).
  const [buyer, expertRecord] = await Promise.all([
    prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: { email: true },
    }),
    prisma.expert.findUnique({
      where: { id: expertId },
      select: { pseudo: true },
    }),
  ]);
  if (buyer && expertRecord) {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    const magicToken = await createMagicLink(buyer.email);
    const magicLinkUrl = `${backendUrl}/auth/verify?token=${magicToken}`;
    sendAccessUnlockedEmail(
      buyer.email,
      expertRecord.pseudo,
      expertId,
      magicLinkUrl,
    );
  }
}

async function handleInvoicePaid(event: StripeEvent): Promise<void> {
  const invoice = event.data.object as unknown as {
    subscription?: string | null;
  };
  const subscriptionId = invoice.subscription ?? null;
  if (!subscriptionId) {
    // Invoice non liée à un abonnement (paiement one-shot, etc.).
    // Marqué processed pour éviter le retry inutile.
    await markEventProcessed(prisma, event);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Check if it's an expert quarterly renewal
    const expert = await tx.expert.findFirst({
      where: { stripeSubId: subscriptionId },
    });
    if (expert) {
      await tx.expert.update({
        where: { id: expert.id },
        data: {
          subStatus: "ACTIVE",
          subExpiresAt: new Date(Date.now() + QUARTER),
        },
      });
      console.log(`[webhook] Expert sub renewed: ${expert.pseudo}`);
      await markEventProcessed(tx, event);
      return;
    }

    // Otherwise it's a user subscription renewal
    const sub = await tx.subscription.findFirst({
      where: { stripeSubId: subscriptionId },
    });
    if (sub) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + MONTH),
        },
      });
      console.log(`[webhook] Subscription renewed: ${sub.id}`);
    }
    await markEventProcessed(tx, event);
  });
}

async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const subscription = event.data.object as { id: string };

  await prisma.$transaction(async (tx) => {
    // Check if it's an expert sub
    const expert = await tx.expert.findFirst({
      where: { stripeSubId: subscription.id },
    });
    if (expert) {
      await tx.expert.update({
        where: { id: expert.id },
        data: { subStatus: "EXPIRED" },
      });
      console.log(`[webhook] Expert sub expired: ${expert.pseudo}`);
      await markEventProcessed(tx, event);
      return;
    }

    // Otherwise user sub
    const sub = await tx.subscription.findFirst({
      where: { stripeSubId: subscription.id },
    });
    if (sub) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELLED" },
      });
      console.log(`[webhook] Subscription cancelled: ${sub.id}`);
    }
    await markEventProcessed(tx, event);
  });
}

export default router;
