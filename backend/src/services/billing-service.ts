import { z } from "zod";

import { Prisma } from "../generated/prisma/client";
import { Sport } from "../generated/prisma/enums";
import { sendAccessUnlockedEmail } from "../lib/emails";
import { logger, maskEmail } from "../lib/logger";
import { createMagicLink } from "../lib/magic-link";
import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

/**
 * Service Billing — handlers Stripe webhook + idempotence event-level.
 *
 * Le service ne dépend pas d'Express : il prend des StripeEvent typés
 * et opère sur la DB. La route /webhooks/stripe se charge uniquement
 * de :
 *  1. Vérifier la signature Stripe (rejette 400 si invalide)
 *  2. Vérifier l'idempotence event-level (skip si déjà traité)
 *  3. Dispatcher sur le bon handler service par event.type
 *  4. Répondre 200
 *
 * Convention transactions : chaque handler exécute la mutation métier
 * + markEventProcessed dans la MÊME transaction. Si la mutation
 * échoue, l'event n'est pas marqué processed → Stripe retentera (TTL
 * jusqu'à 3 jours par défaut).
 */

// Sprint Polish A.10 — Zod parse de `sports` désérialisé du metadata
// Stripe. Un payload corrompu (Dashboard manipulé, retry sur event avec
// metadata altérée) ferait passer des strings invalides dans l'enum
// Sport de Prisma → 500. Zod garantit que ce qui arrive en DB est
// strictement une valeur de l'enum.
const sportsArraySchema = z.array(z.nativeEnum(Sport)).min(1);

const webhookLogger = logger.child({ context: "webhook" });

// Type de l'event Stripe — inféré depuis `constructEvent` plutôt que
// d'importer le namespace Stripe (qui n'est pas exposé proprement par
// le SDK stripe-node 22 — l'entrée CJS n'exporte que le constructor).
// Évite le faux positif TS2694 "Namespace 'StripeConstructor' has no
// exported member 'Event'".
export type StripeEvent = ReturnType<typeof stripe.webhooks.constructEvent>;

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const QUARTER = 90 * DAY;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// Client accepté par markEventProcessed : soit prisma global, soit un
// client de transaction Prisma — les deux exposent la même API pour
// stripeWebhookEvent.create.
type EventStoreClient = Pick<typeof prisma, "stripeWebhookEvent">;

/**
 * Log l'event Stripe comme traité (idempotence event-level). Le payload
 * est conservé ≥ 90j pour la fenêtre de dispute Stripe — sert d'audit
 * trail si un litige nécessite de retrouver les données exactes.
 */
export async function markEventProcessed(
  client: EventStoreClient,
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

/**
 * Lookup idempotence : true si l'event a déjà été traité auparavant.
 * Stripe peut retenter le même event ; on skip et on répond 200 pour
 * stopper les retries.
 */
export async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { id: eventId },
  });
  return !!existing;
}

/**
 * Dispatch principal — chaque handler implémente la logique métier pour
 * un type d'event. Les events non gérés sont marqués processed pour
 * éviter le retry storm.
 */
export async function processStripeEvent(event: StripeEvent): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      return;
    case "invoice.paid":
      await handleInvoicePaid(event);
      return;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      return;
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event);
      return;
    case "charge.dispute.created":
      await handleDisputeCreated(event);
      return;
    default:
      await markEventProcessed(prisma, event);
      return;
  }
}

// ── checkout.session.completed ─────────────────────────────────────

async function handleCheckoutSessionCompleted(event: StripeEvent): Promise<void> {
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

  // Branche "become expert"
  // Accept both new and legacy `purpose` for backward-compat during le
  // rollout tipster→expert. Anciennes sessions Stripe créées avant le
  // rename portent encore "become_tipster".
  if (purpose === "become_expert" || purpose === "become_tipster") {
    await processBecomeExpertSession(event, session, metadata, userId);
    return;
  }

  // Branche "user subscription" (day pass / monthly)
  await processUserSubscriptionSession(event, session, metadata);
}

async function processBecomeExpertSession(
  event: StripeEvent,
  session: { id: string; subscription: string | null },
  metadata: Record<string, string>,
  userId: string,
): Promise<void> {
  const { pseudo, bio, sports: sportsJson } = metadata;

  // Validation stricte du metadata. Si payload corrompu, on log + mark
  // processed (évite retry storm) → admin peut ré-attribuer le sub
  // manuellement.
  const sportsParsed = sportsArraySchema.safeParse(JSON.parse(sportsJson));
  if (!sportsParsed.success) {
    webhookLogger.error(
      {
        eventId: event.id,
        eventType: event.type,
        rawSports: sportsJson,
        zodErrors: sportsParsed.error.flatten(),
      },
      "Invalid sports metadata in become_expert payload — skipping",
    );
    await markEventProcessed(prisma, event);
    return;
  }

  const sports = sportsParsed.data;
  const stripeSubId = session.subscription as string;

  await prisma.$transaction(async (tx) => {
    // Application-level idempotence (defense in depth — event table
    // couvre déjà le replay Stripe).
    const existingExpert = await tx.expert.findUnique({ where: { userId } });
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
}

async function processUserSubscriptionSession(
  event: StripeEvent,
  session: {
    id: string;
    metadata: Record<string, string> | null;
    subscription: string | null;
    customer: string | null;
    customer_details: { email: string | null } | null;
  },
  metadata: Record<string, string>,
): Promise<void> {
  // expertId : nouveau nom de clé. Backward-compat avec tipsterId pour
  // les sessions Stripe pending pré-rename.
  const expertId = metadata.expertId || metadata.tipsterId;
  const { type } = metadata;

  // Resolve userId AVANT la transaction. User.email a une contrainte
  // unique → re-trying un user-create par email est idempotent.
  let resolvedUserId = metadata.userId;
  const email = metadata.email || session.customer_details?.email;

  if (!resolvedUserId && email) {
    const normalizedEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
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
  // achat préalable, puis premier achat).
  if (resolvedUserId && session.customer) {
    await prisma.user.updateMany({
      where: { id: resolvedUserId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer },
    });
  }

  if (!resolvedUserId) {
    // État non-récupérable — mark processed pour éviter retry storm.
    webhookLogger.error(
      { eventId: event.id, eventType: event.type },
      "No userId/email in event metadata",
    );
    await markEventProcessed(prisma, event);
    return;
  }

  const stripeSubId = type === "MONTHLY" ? (session.subscription as string) : null;
  const expiresAt = type === "DAY_PASS" ? new Date(Date.now() + DAY) : new Date(Date.now() + MONTH);

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
        userId: resolvedUserId,
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

  // Fire-and-forget email POST-transaction. Si l'envoi échoue, l'erreur
  // est loggée dans sendAccessUnlockedEmail mais on ne rollback PAS la
  // subscription (l'admin peut renvoyer le lien manuellement plus tard).
  await sendAccessEmailForSubscription(resolvedUserId, expertId);
}

/**
 * Envoie l'email "accès débloqué" avec un magic-link pointant vers le
 * profile de l'expert acheté. Crucial depuis la suppression de
 * /auth/session-from-checkout — le magic-link est désormais la SEULE
 * voie pour poser une session à un buyer pas encore loggé.
 */
async function sendAccessEmailForSubscription(userId: string, expertId: string): Promise<void> {
  const [buyer, expertRecord] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    }),
    prisma.expert.findUnique({
      where: { id: expertId },
      select: { pseudo: true },
    }),
  ]);
  if (!buyer || !expertRecord) return;

  const magicToken = await createMagicLink(buyer.email);
  const redirectTarget = encodeURIComponent(`/experts/${expertId}`);
  const magicLinkUrl = `${BACKEND_URL}/auth/verify?token=${magicToken}&redirect=${redirectTarget}`;
  sendAccessUnlockedEmail(buyer.email, expertRecord.pseudo, expertId, magicLinkUrl);
}

// ── invoice.paid ────────────────────────────────────────────────────

async function handleInvoicePaid(event: StripeEvent): Promise<void> {
  // Le champ `invoice.subscription` est présent en runtime sur les
  // events Stripe API 2024+ mais retiré du type officiel à partir de
  // 2026-03-25.dahlia (déplacé vers
  // `invoice.parent.subscription_details.subscription`). On lit en
  // best-effort via une shape minimale.
  type LegacyInvoiceShape = {
    subscription?: string | { id: string } | null;
    parent?: {
      subscription_details?: { subscription?: string | null } | null;
    } | null;
  };
  const invoice = event.data.object as unknown as LegacyInvoiceShape;
  const legacyRef = invoice.subscription;
  const newRef = invoice.parent?.subscription_details?.subscription ?? null;
  const subscriptionId =
    typeof legacyRef === "string"
      ? legacyRef
      : typeof legacyRef === "object" && legacyRef !== null
        ? legacyRef.id
        : newRef;

  if (!subscriptionId) {
    // Invoice non liée à un abonnement (paiement one-shot, etc.).
    await markEventProcessed(prisma, event);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Expert quarterly renewal ?
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

    // Sinon user subscription renewal
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
      webhookLogger.info({ eventId: event.id, subscriptionId: sub.id }, "Subscription renewed");
    }
    await markEventProcessed(tx, event);
  });
}

// ── customer.subscription.deleted ──────────────────────────────────

async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const subscription = event.data.object as { id: string };

  await prisma.$transaction(async (tx) => {
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

    const sub = await tx.subscription.findFirst({
      where: { stripeSubId: subscription.id },
    });
    if (sub) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELLED" },
      });
      webhookLogger.info({ eventId: event.id, subscriptionId: sub.id }, "Subscription cancelled");
    }
    await markEventProcessed(tx, event);
  });
}

// ── payment_intent.payment_failed ──────────────────────────────────

/**
 * Paiement échoué après checkout (3DS abandon, fonds insuffisants,
 * fraude détectée, etc.).
 *
 * Pour Plarya en l'état, on ne crée une Subscription qu'à
 * checkout.session.completed (paiement déjà confirmé). Donc
 * payment_failed arrive AVANT qu'on ait quoi que ce soit en DB — pas
 * d'état à rollback. On log en warn (signal pour alerting éventuel)
 * et on marque comme processed.
 *
 * Si plus tard on crée des Subscription en PENDING pré-paiement, ce
 * handler devra les passer en EXPIRED ici.
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

// ── charge.dispute.created ─────────────────────────────────────────

/**
 * Chargeback initié par l'acheteur.
 *
 * Logué en error : en prod, Sentry/Datadog peut alerter dessus pour
 * qu'un humain regarde manuellement (gestion du litige côté Stripe
 * Dashboard).
 *
 * Action métier (V2) : retrouver la Subscription via le PaymentIntent
 * Stripe, la passer en CANCELLED. Pour l'instant on log + mark
 * processed ; la Subscription concernée sera identifiée manuellement
 * via le Dashboard.
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
    await markEventProcessed(tx, event);
  });
}
