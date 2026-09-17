import type { Prisma } from "../generated/prisma/client";
import type { ExpertSubStatus } from "../generated/prisma/enums";

/**
 * Délai de grâce après `subExpiresAt`. `subExpiresAt` est posé à +90 jours
 * alors qu'un trimestre Stripe en compte 89 à 92 : sans marge, un expert
 * serait bloqué quelques heures avant que le renouvellement (`invoice.paid`)
 * n'arrive.
 */
export const EXPERT_SUB_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

type ExpertSubscriptionState = {
  subStatus: ExpertSubStatus;
  subExpiresAt: Date | null;
};

/**
 * Un expert peut publier, être listé et vendre tant que son abonnement
 * expert est actif :
 *  - FREE : compte créé par l'admin, sans abonnement à payer ;
 *  - ACTIVE : abonnement en cours, échéance (grâce comprise) non dépassée ;
 *  - EXPIRED : abonnement arrêté côté Stripe.
 */
export function isExpertSubscriptionActive(
  expert: ExpertSubscriptionState,
  now = new Date(),
): boolean {
  if (expert.subStatus === "FREE") return true;
  if (expert.subStatus === "EXPIRED") return false;
  if (!expert.subExpiresAt) return true;
  return expert.subExpiresAt.getTime() + EXPERT_SUB_GRACE_MS > now.getTime();
}

/** Équivalent Prisma de `isExpertSubscriptionActive`, pour filtrer en base. */
export function activeExpertSubscriptionWhere(now = new Date()): Prisma.ExpertWhereInput {
  const cutoff = new Date(now.getTime() - EXPERT_SUB_GRACE_MS);
  return {
    OR: [
      { subStatus: "FREE" },
      { subStatus: "ACTIVE", subExpiresAt: null },
      { subStatus: "ACTIVE", subExpiresAt: { gt: cutoff } },
    ],
  };
}
