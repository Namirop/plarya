import { z } from "zod";

import { Prisma } from "../generated/prisma/client";
import { Sport } from "../generated/prisma/enums";
import { sendAccessUnlockedEmail } from "../lib/emails";
import { logger, maskEmail } from "../lib/logger";
import { createMagicLink } from "../lib/magic-link";
import { isExpertSubscriptionActive } from "../lib/expert-access";
import { prisma } from "../lib/prisma";
import { stripe, STRIPE_APP_TAG } from "../lib/stripe";

/**
 * Traitement des webhooks Stripe, indépendant d'Express (la route vérifie la
 * signature et l'idempotence, puis délègue ici).
 *
 * Chaque handler écrit sa mutation et markEventProcessed dans la même
 * transaction : en cas d'échec, l'événement n'est pas marqué et Stripe le
 * renverra.
 */

// Les metadata Stripe sont revalidées : une valeur hors enum ferait échouer Prisma.
const sportsArraySchema = z.array(z.nativeEnum(Sport)).min(1);

const webhookLogger = logger.child({ context: "webhook" });

// Inféré de `constructEvent` : l'entrée CJS de stripe-node 22 n'exporte pas le
// namespace de types (erreur TS2694 sur `Stripe.Event`).
export type StripeEvent = ReturnType<typeof stripe.webhooks.constructEvent>;

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const QUARTER = 90 * DAY;

// Slash final retiré pour éviter `//auth/verify` dans le magic-link.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

// Client Prisma global ou client de transaction.
type EventStoreClient = Pick<typeof prisma, "stripeWebhookEvent">;

/** Marque l'événement comme traité ; le payload est conservé pour l'audit (litiges). */
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

/** Vrai si Stripe renvoie un événement déjà traité : la route répond 200 sans rejouer. */
export async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { id: eventId },
  });
  return !!existing;
}

/** Aiguillage par type d'événement ; les types non gérés sont simplement marqués traités. */
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
  // Stripe.Checkout.Session, réduit aux champs lus (voir StripeEvent).
  const session = event.data.object as {
    id: string;
    metadata: Record<string, string> | null;
    subscription: string | null;
    customer: string | null;
    customer_details: { email: string | null } | null;
  };
  const metadata = (session.metadata ?? {}) as Record<string, string>;

  // Session d'une autre application du compte (voir STRIPE_APP_TAG) ou sans
  // metadata : acquittée sans traitement, sinon Stripe la renverrait.
  if (metadata.app !== STRIPE_APP_TAG) {
    webhookLogger.info(
      { eventId: event.id, eventType: event.type, app: metadata.app ?? null },
      "Checkout session from another app — skipping",
    );
    await markEventProcessed(prisma, event);
    return;
  }

  const { userId, purpose } = metadata;

  // Abonnement expert (`become_tipster` : alias de l'ancien nommage).
  if (purpose === "become_expert" || purpose === "become_tipster") {
    await processBecomeExpertSession(event, session, metadata, userId);
    return;
  }

  // Achat d'un pass jour ou d'un abonnement mensuel.
  await processUserSubscriptionSession(event, session, metadata);
}

async function processBecomeExpertSession(
  event: StripeEvent,
  session: { id: string; subscription: string | null },
  metadata: Record<string, string>,
  userId: string,
): Promise<void> {
  const { pseudo, bio, sports: sportsJson } = metadata;

  // Metadata invalides : erreur journalisée et événement marqué traité (un
  // renvoi échouerait de la même façon) ; correction manuelle nécessaire.
  let sportsRaw: unknown;
  try {
    sportsRaw = JSON.parse(sportsJson);
  } catch (err) {
    webhookLogger.error(
      { eventId: event.id, eventType: event.type, rawSports: sportsJson, err },
      "Malformed sports JSON in become_expert metadata — skipping",
    );
    await markEventProcessed(prisma, event);
    return;
  }

  const sportsParsed = sportsArraySchema.safeParse(sportsRaw);
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
  if (!session.subscription) {
    webhookLogger.error(
      { eventId: event.id, eventType: event.type, userId },
      "Become-expert session has no subscription ID — skipping",
    );
    await markEventProcessed(prisma, event);
    return;
  }
  const stripeSubId = session.subscription;

  await prisma.$transaction(async (tx) => {
    // Idempotence applicative, en plus de la table des événements.
    const existingExpert = await tx.expert.findUnique({ where: { userId } });
    if (existingExpert) {
      // Réactivation d'un abonnement expert arrêté : même fiche, nouvel
      // abonnement Stripe.
      if (!existingExpert.deletedAt && !isExpertSubscriptionActive(existingExpert)) {
        await tx.expert.update({
          where: { id: existingExpert.id },
          data: {
            subStatus: "ACTIVE",
            subExpiresAt: new Date(Date.now() + QUARTER),
            stripeSubId,
            subCancelAtPeriodEnd: false,
          },
        });
      }
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
  // `tipsterId` : alias de l'ancien nommage.
  const expertId = metadata.expertId || metadata.tipsterId;
  const { type } = metadata;

  // Session incomplète : arrêt avant toute création d'utilisateur.
  if (!expertId || !type) {
    webhookLogger.error(
      { eventId: event.id, eventType: event.type },
      "Checkout session missing expertId/type — skipping",
    );
    await markEventProcessed(prisma, event);
    return;
  }

  // Utilisateur résolu avant la transaction (acheteur anonyme : par email).
  let resolvedUserId = metadata.userId;
  const email = metadata.email || session.customer_details?.email;

  if (!resolvedUserId && email) {
    const normalizedEmail = email.toLowerCase();
    // Upsert sur l'email unique : pas de doublon si deux webhooks arrivent en
    // même temps ; renseigne aussi stripeCustomerId sur un compte existant.
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: session.customer ? { stripeCustomerId: session.customer } : {},
      create: {
        email: normalizedEmail,
        ...(session.customer ? { stripeCustomerId: session.customer } : {}),
      },
    });
    resolvedUserId = user.id;
    webhookLogger.info(
      { eventId: event.id, eventType: event.type, email: maskEmail(normalizedEmail) },
      "User resolved via upsert",
    );
  }

  if (!resolvedUserId) {
    // Irrécupérable : marqué traité pour que Stripe ne le renvoie pas.
    webhookLogger.error(
      { eventId: event.id, eventType: event.type },
      "No userId/email in event metadata",
    );
    await markEventProcessed(prisma, event);
    return;
  }

  let stripeSubId: string | null = null;
  if (type === "MONTHLY") {
    if (!session.subscription) {
      webhookLogger.error(
        { eventId: event.id, eventType: event.type, expertId, type },
        "Monthly subscription session has no subscription ID — skipping",
      );
      await markEventProcessed(prisma, event);
      return;
    }
    stripeSubId = session.subscription;
  }
  const expiresAt = type === "DAY_PASS" ? new Date(Date.now() + DAY) : new Date(Date.now() + MONTH);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findUnique({
      where: { stripeSessionId: session.id },
      select: { id: true },
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

  // Email envoyé après la transaction : un échec d'envoi n'annule pas
  // l'abonnement (renvoi possible via POST /auth/resend-access-unlocked).
  await sendAccessEmailForSubscription(resolvedUserId, expertId);
}

/**
 * Email « Accès débloqué » avec un magic-link vers la page de l'expert :
 * seule voie de connexion pour un acheteur non connecté.
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
  // Selon la version d'API, l'abonnement est dans `invoice.subscription` ou,
  // depuis 2026-03-25.dahlia, dans `invoice.parent.subscription_details` :
  // les deux emplacements sont lus.
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
    // Facture sans abonnement (paiement unique).
    await markEventProcessed(prisma, event);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Renouvellement trimestriel d'un expert…
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

    // … ou d'un abonnement mensuel d'utilisateur.
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
 * Paiement échoué (3DS abandonné, fonds insuffisants…). Les abonnements
 * n'étant créés qu'après paiement confirmé, rien n'est à annuler : simple
 * avertissement journalisé.
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
 * Litige (chargeback) ouvert par un acheteur, journalisé en erreur.
 * Limite connue : l'abonnement concerné n'est pas annulé automatiquement,
 * le litige se traite depuis le Dashboard Stripe.
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
