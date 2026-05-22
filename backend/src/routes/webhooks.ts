import { Router } from "express";
import express from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { logger, maskEmail } from "../lib/logger";
import { sendAccessUnlockedEmail } from "../lib/emails";
import { createMagicLink } from "../lib/magic-link";
import type { Sport } from "../generated/prisma/enums";

const webhookLogger = logger.child({ context: "webhook" });

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
      webhookLogger.error({ err }, "Signature verification failed");
      res.status(400).send("Signature invalide");
      return;
    }

    // 2. Idempotence event-level : si on a déjà traité cet event,
    //    on skip et on répond 200 (Stripe stoppe les retries).
    const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });
    if (alreadyProcessed) {
      webhookLogger.info(
        { eventId: event.id, eventType: event.type },
        "Event already processed, skipping",
      );
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

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event);
        break;

      default:
        // Event qu'on n'a pas à traiter : on le marque comme processed
        // pour éviter le retry inutile par Stripe.
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
  // ciblé.
  const session = event.data.object as {
    id: string;
    metadata: Record<string, string> | null;
    subscription: string | null;
    customer: string | null;
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
    webhookLogger.info(
      { eventId: event.id, eventType: event.type, userId, pseudo },
      "Expert created",
    );
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
      // User auto-créé : on persiste directement le stripeCustomerId
      // reçu en session.customer (Stripe a créé un Customer pour
      // l'email passé en customer_email). Évite un round-trip update
      // ultérieur.
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          ...(session.customer ? { stripeCustomerId: session.customer } : {}),
        },
      });
      webhookLogger.info(
        { eventId: event.id, eventType: event.type, email: maskEmail(normalizedEmail) },
        "User auto-created",
      );
    }
    resolvedUserId = user.id;
  }

  // Backfill stripeCustomerId si le User existait déjà SANS Customer
  // Stripe lié (cas : User créé manuellement / via magic-link sans
  // achat préalable, puis premier achat). On le persiste maintenant
  // pour réutilisation aux achats suivants.
  if (resolvedUserId && session.customer) {
    await prisma.user.updateMany({
      where: { id: resolvedUserId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer },
    });
  }

  if (!resolvedUserId) {
    // Impossible de faire progresser cet event. On le mark processed
    // pour éviter un retry storm sur un état non-récupérable.
    webhookLogger.error(
      { eventId: event.id, eventType: event.type },
      "No userId/email in event metadata",
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
  webhookLogger.info(
    { eventId: event.id, eventType: event.type, type, userId: resolvedUserId, expertId },
    "Subscription created",
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
    // `redirect=/experts/${expertId}` : après vérification du
    // magic-link, l'user atterrit directement sur la page de l'expert
    // qu'il vient d'acheter (au lieu de la home par défaut). Crucial
    // depuis qu'on a supprimé /auth/session-from-checkout (sprint
    // refonte 2 phase 2) — le magic-link est la SEULE voie pour
    // poser une session à un user pas encore loggé qui vient
    // d'acheter.
    const redirectTarget = encodeURIComponent(`/experts/${expertId}`);
    const magicLinkUrl = `${backendUrl}/auth/verify?token=${magicToken}&redirect=${redirectTarget}`;
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
      webhookLogger.info(
        { eventId: event.id, expertId: expert.id, pseudo: expert.pseudo },
        "Expert sub renewed",
      );
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
      webhookLogger.info(
        { eventId: event.id, subscriptionId: sub.id },
        "Subscription renewed",
      );
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
      webhookLogger.info(
        { eventId: event.id, expertId: expert.id, pseudo: expert.pseudo },
        "Expert sub expired",
      );
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
      webhookLogger.info(
        { eventId: event.id, subscriptionId: sub.id },
        "Subscription cancelled",
      );
    }
    await markEventProcessed(tx, event);
  });
}

/**
 * payment_intent.payment_failed — paiement échoué après le checkout
 * (3DS abandon, fonds insuffisants, fraude détectée, etc.).
 *
 * Pour Plarya en l'état, on ne crée une Subscription qu'à
 * checkout.session.completed (paiement déjà confirmé). Donc
 * payment_failed arrive AVANT qu'on ait quoi que ce soit en DB —
 * pas d'état à rollback. On log en warn (signal pour alerting
 * éventuel) et on marque comme processed.
 *
 * Si plus tard on crée des Subscription en PENDING pre-paiement,
 * ce handler devra les passer en EXPIRED ici.
 */
async function handlePaymentFailed(event: StripeEvent): Promise<void> {
  const intent = event.data.object as {
    id?: string;
    customer?: string | null;
    last_payment_error?: { code?: string; message?: string } | null;
  };
  webhookLogger.warn(
    {
      eventId: event.id,
      paymentIntentId: intent.id,
      customerId: intent.customer,
      failureCode: intent.last_payment_error?.code,
      failureMessage: intent.last_payment_error?.message,
    },
    "Payment failed post-checkout",
  );
  await markEventProcessed(prisma, event);
}

/**
 * charge.dispute.created — chargeback initié par l'acheteur.
 *
 * Action métier : retrouver la Subscription liée via le PaymentIntent
 * Stripe (ou le customer), la passer en CANCELLED. (On n'introduit
 * pas d'enum DISPUTED dédié — CANCELLED suffit pour la logique
 * d'accès, et on garde la trace exacte dans le payload de l'event
 * stocké dans stripe_webhook_events.)
 *
 * Logué en error : en prod, Sentry/Datadog peut alerter dessus
 * pour qu'un humain regarde manuellement (gestion du litige côté
 * Stripe Dashboard).
 */
async function handleDisputeCreated(event: StripeEvent): Promise<void> {
  const dispute = event.data.object as {
    id?: string;
    payment_intent?: string | null;
    charge?: string | null;
    amount?: number;
    reason?: string;
  };

  webhookLogger.error(
    {
      eventId: event.id,
      disputeId: dispute.id,
      paymentIntentId: dispute.payment_intent,
      chargeId: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
    },
    "Charge dispute created — manual review needed",
  );

  await prisma.$transaction(async (tx) => {
    // Resolve charge → payment intent → customer email is non-trivial
    // sans appel API Stripe. Pour l'instant on log + mark processed.
    // La Subscription concernée sera identifiée manuellement par
    // l'admin via le Stripe Dashboard (le disputeId est dans le log).
    // À étendre en V2 : `stripe.paymentIntents.retrieve(dispute.payment_intent)`
    // pour récupérer le customer.email puis chercher la Subscription
    // par email + auto-CANCELLED.
    await markEventProcessed(tx, event);
  });
}

export default router;
