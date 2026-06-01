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
  NoUpcomingPronosError,
  PseudoTakenError,
  UserNotFoundError,
} from "./errors";

/**
 * Service Checkout — orchestration Stripe Checkout (création de
 * sessions) avec les règles métier Plarya.
 *
 * Le service throw des erreurs métier typées (cf. ./errors.ts) ; les
 * routes les mappent vers HTTP via handleError(). Les appels Stripe
 * eux-mêmes peuvent lever des erreurs réseau / 5xx — laissées remonter
 * en non-ServiceError, le handler les log et renvoie 500.
 */

// Slash final retiré → pas de `//experts/...` dans les URLs Stripe.
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

// Prix de l'abonnement Expert : 39€/trimestre. Centralisé ici plutôt
// qu'inline dans la session Stripe pour faciliter un changement futur
// (la valeur n'est PAS persistée côté Expert ou User en DB — c'est
// purement une config produit côté plateforme).
const EXPERT_QUARTERLY_PRICE_CENTS = 3900;

/**
 * Récupère le Stripe Customer ID d'un User, ou en crée un si absent.
 * Persiste l'ID en DB (User.stripeCustomerId) pour réutilisation lors
 * des achats suivants — évite les doublons de Customer côté Stripe.
 *
 * Race condition possible (deux checkouts simultanés du même user) :
 * créerait 2 Customers Stripe mais 1 seul gagne le UPDATE en DB.
 * Acceptable en MVP (orphelin Stripe au pire). À renforcer en V2
 * via row lock ou pattern advisory lock Postgres si nécessaire.
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
 * Crée une session Stripe Checkout pour l'achat d'un day pass ou
 * d'une subscription mensuelle vers un expert.
 *
 * Flow :
 *  - Caller authentifié : on récupère son email depuis la DB,
 *    on attache un Stripe Customer (créé/réutilisé).
 *  - Caller anonyme : email obligatoire en body. On cherche un User
 *    existant ; si trouvé on attache son Customer, sinon Stripe créera
 *    le Customer et le User sera créé au webhook
 *    checkout.session.completed (cf. webhooks.ts).
 *
 * Erreurs métier :
 *  - EmailRequiredError (401) si caller anonyme sans email
 *  - AlreadySubscribedError (400) si sub ACTIVE en cours
 *  - ExpertNotFoundError (404) si expert n'existe pas ou soft-deleted
 *  - ExpertPendingDeletionError (400) si expert en suppression programmée
 *  - NoUpcomingPronosError (400) si type=DAY_PASS et plus aucune
 *    analyse à venir aujourd'hui
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
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail },
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

  // 4. Day pass : vérifier qu'au moins une analyse n'a pas commencé.
  // Sans ce guard, un acheteur late-night paie pour 0 analyse à voir.
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

  // `app` : tag multi-projets (compte Stripe partagé) — cf. STRIPE_APP_TAG.
  const metadata: Record<string, string> = { app: STRIPE_APP_TAG, expertId, type };
  if (userId) metadata.userId = userId;
  if (customerEmail) metadata.email = customerEmail;

  let stripeCustomerId: string | undefined;
  if (userId && customerEmail) {
    stripeCustomerId = await getOrCreateStripeCustomer(userId, customerEmail);
  }

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    // payment_method_types retiré : Stripe Checkout détecte automatiquement
    // les méthodes activées sur le compte (card, Apple Pay sur iPhone
    // Safari, Google Pay sur Android Chrome).
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
 * Crée une session Stripe Checkout pour devenir Expert.
 *
 * Mode subscription récurrent trimestriel (39€/3 mois). L'expert n'est
 * créé en DB qu'au webhook checkout.session.completed (le caller doit
 * payer avant d'obtenir le rôle EXPERT) — cf. webhooks.ts.
 *
 * Erreurs métier :
 *  - AlreadyExpertError (400) si l'user est déjà expert (role EXPERT
 *    ou ligne expert existante — defensive)
 *  - UserNotFoundError (404) si pas d'email (ne devrait jamais arriver
 *    derrière authMiddleware, mais defensive)
 *  - PseudoTakenError (400) si pseudo déjà utilisé
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

  if (user?.role === "EXPERT" || user?.expert) {
    throw new AlreadyExpertError();
  }

  if (!user?.email) {
    throw new UserNotFoundError();
  }

  const existingPseudo = await prisma.expert.findUnique({ where: { pseudo } });
  if (existingPseudo) {
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
