import { isExpertSubscriptionActive } from "../lib/expert-access";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { stripe, STRIPE_APP_TAG } from "../lib/stripe";
import type { BecomeExpertInput, CreateCheckoutInput } from "../validators/checkout";

import {
  AlreadyExpertError,
  AlreadySubscribedError,
  EmailRequiredError,
  ExpertNotFoundError,
  ExpertPendingDeletionError,
  ExpertUnavailableError,
  NoUpcomingPronosError,
  PseudoTakenError,
  UserNotFoundError,
} from "./errors";

/**
 * Création des sessions Stripe Checkout selon les règles métier. Les erreurs
 * métier sont typées (./errors.ts) ; une erreur Stripe ou réseau remonte telle
 * quelle et produit un 500.
 */

// Slash final retiré pour éviter `//experts/...` dans les URL de retour.
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

// Prix de l'abonnement expert trimestriel : paramètre de la plateforme, non stocké en base.
const EXPERT_QUARTERLY_PRICE_CENTS = 3900;

/**
 * Customer Stripe de l'utilisateur, créé et enregistré au premier achat.
 * Limite connue : deux paiements simultanés peuvent créer deux Customers
 * (un seul est enregistré, l'autre reste orphelin côté Stripe).
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  logger.info({ userId, stripeCustomerId: customer.id }, "Stripe customer created");
  return customer.id;
}

/**
 * Session Checkout pour un pass jour ou un abonnement mensuel. Acheteur
 * connecté : Customer Stripe réutilisé. Acheteur anonyme : email requis ;
 * sans compte existant, l'utilisateur est créé par le webhook
 * checkout.session.completed (billing-service).
 *
 * Erreurs : EmailRequiredError (400), AlreadySubscribedError (400),
 * ExpertNotFoundError (404), ExpertPendingDeletionError et
 * ExpertUnavailableError (400), NoUpcomingPronosError (400, pass jour sans
 * analyse à venir).
 */
export async function createCheckoutSession(
  input: CreateCheckoutInput,
  caller: { userId: string } | null,
): Promise<{ url: string | null }> {
  const { expertId, type, email: bodyEmail } = input;

  // 1. Résoudre userId + email
  let userId: string | undefined;
  let customerEmail: string | undefined;

  if (caller) {
    userId = caller.userId;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    customerEmail = dbUser?.email;
  } else if (bodyEmail) {
    customerEmail = bodyEmail.toLowerCase();
    // findFirst : le filtre deletedAt évite de rattacher le paiement à un compte supprimé.
    const existingUser = await prisma.user.findFirst({
      where: { email: customerEmail, deletedAt: null },
      select: { id: true },
    });
    if (existingUser) {
      userId = existingUser.id;
    }
  } else {
    throw new EmailRequiredError();
  }

  // 2. Pas de double-achat si déjà abonné actif
  if (userId) {
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        expertId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (existing) {
      throw new AlreadySubscribedError();
    }
  }

  // 3. Vérifier l'état de l'expert
  const expert = await prisma.expert.findUnique({ where: { id: expertId } });
  if (!expert || expert.deletedAt) {
    throw new ExpertNotFoundError();
  }
  if (expert.pendingDeletionAt) {
    throw new ExpertPendingDeletionError();
  }
  if (!isExpertSubscriptionActive(expert)) {
    throw new ExpertUnavailableError();
  }

  // 4. Pass jour : au moins une analyse du jour pas encore commencée.
  if (type === "DAY_PASS") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingCount = await prisma.prono.count({
      where: {
        expertId,
        createdAt: { gte: today },
        startTime: { gt: new Date() },
      },
    });

    if (upcomingCount === 0) {
      throw new NoUpcomingPronosError();
    }
  }

  // 5. Construire la session Stripe
  const isSubscription = type === "MONTHLY";
  const amount = isSubscription ? expert.monthlyPrice : expert.dayPassPrice;

  // `app` : voir STRIPE_APP_TAG.
  const metadata: Record<string, string> = { app: STRIPE_APP_TAG, expertId, type };
  if (userId) metadata.userId = userId;
  if (customerEmail) metadata.email = customerEmail;

  let stripeCustomerId: string | undefined;
  if (userId && customerEmail) {
    stripeCustomerId = await getOrCreateStripeCustomer(userId, customerEmail);
  }

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    // Sans payment_method_types : Checkout propose les moyens de paiement
    // activés sur le compte (carte, Apple Pay, Google Pay).
    ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail }),
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: {
            name: isSubscription
              ? `Abonnement mensuel — ${expert.pseudo}`
              : `Day Pass — ${expert.pseudo}`,
          },
          ...(isSubscription ? { recurring: { interval: "month" as const } } : {}),
        },
        quantity: 1,
      },
    ],
    metadata,
    success_url: `${FRONTEND_URL}/experts/${expertId}?checkout=success&stripe_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/experts/${expertId}?checkout=cancel`,
  });

  return { url: session.url };
}

/**
 * Session Checkout de l'abonnement expert trimestriel. Le profil expert n'est
 * créé (ou réactivé, si son abonnement était arrêté) qu'au webhook
 * checkout.session.completed, donc après paiement.
 *
 * Erreurs : AlreadyExpertError (400, expert à l'abonnement actif),
 * UserNotFoundError (404), PseudoTakenError (400).
 */
export async function createBecomeExpertSession(
  userId: string,
  input: BecomeExpertInput,
): Promise<{ url: string | null }> {
  const { pseudo, bio, sports } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { expert: true },
  });

  const renewing =
    !!user?.expert && !user.expert.deletedAt && !isExpertSubscriptionActive(user.expert);
  if ((user?.role === "EXPERT" || user?.expert) && !renewing) {
    throw new AlreadyExpertError();
  }

  if (!user?.email) {
    throw new UserNotFoundError();
  }

  const existingPseudo = await prisma.expert.findUnique({ where: { pseudo } });
  if (existingPseudo && existingPseudo.userId !== userId) {
    throw new PseudoTakenError();
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(userId, user.email);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: EXPERT_QUARTERLY_PRICE_CENTS,
          product_data: { name: "Abonnement Expert — 39€/trimestre" },
          recurring: { interval: "month" as const, interval_count: 3 },
        },
        quantity: 1,
      },
    ],
    metadata: {
      app: STRIPE_APP_TAG,
      userId,
      pseudo,
      bio: bio || "",
      sports: JSON.stringify(sports),
      purpose: "become_expert",
    },
    success_url: `${FRONTEND_URL}/devenir-expert?checkout=success`,
    cancel_url: `${FRONTEND_URL}/devenir-expert?checkout=cancel`,
  });

  return { url: session.url };
}
