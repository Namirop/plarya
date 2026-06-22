import { prisma } from "../lib/prisma";

/**
 * Vérifie si un user a une subscription ACTIVE non-expirée sur un expert.
 * Renvoie juste un boolean — la route enrobe en { hasAccess }.
 */
export async function hasActiveSubscription(
  userId: string,
  expertId: string,
): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      expertId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return !!sub;
}

/**
 * Lookup non-authentifié pour le polling post-checkout (modale Paiement
 * non confirmé). Renvoie juste { ready } sans aucune donnée sensible —
 * anti-énumération.
 *
 * Désormais findUnique (au lieu de findFirst) car stripeSessionId est
 * @unique en DB (cf. migration add_stripe_indexes_and_unique).
 */
export async function isCheckoutSessionReady(
  stripeSessionId: string,
): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSessionId },
    select: { id: true },
  });
  return !!sub;
}

/**
 * Liste les subscriptions du user appelant (toutes statuts confondus),
 * avec l'expert lié (subset publique : pas d'email côté expert).
 */
export async function listOwnSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: {
      expert: {
        select: { id: true, pseudo: true, photoUrl: true, sports: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
