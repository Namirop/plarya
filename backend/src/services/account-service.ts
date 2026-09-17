import { Prisma } from "../generated/prisma/client";
import type { UserRole } from "../generated/prisma/enums";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { cancelSubscriptionAtPeriodEnd, cancelSubscriptionNow } from "../lib/stripe-subscriptions";

import {
  DeletionAlreadyScheduledError,
  NoDeletionToCancelError,
  NoScheduledDeletionError,
  UserNotFoundError,
} from "./errors";

/**
 * Compte utilisateur : profil, suppression RGPD (immédiate ou programmée),
 * annulation, export des données.
 *
 * Suppression d'un compte EXPERT :
 *
 *      ┌────────────┐  pas de sub active   ┌──────────┐
 *      │  ACTIVE    │ ────────────────────▶│ DELETED  │  (soft)
 *      └────────────┘                       └──────────┘
 *            │                                    ▲
 *            │ sub(s) ACTIVE en cours             │
 *            ▼                                    │ cron 03:15 quotidien
 *      ┌────────────┐                             │ quand dernière sub expirée
 *      │ PENDING    │ ────────────────────────────┘
 *      └────────────┘
 *            ▲ │
 *            │ │  user clique "Annuler"
 *            └─┘
 *
 * Un compte USER est toujours supprimé immédiatement. Les Subscriptions sont
 * conservées (obligations comptables) ; le Customer Stripe garde l'email
 * d'origine.
 */

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type DeletionStatusResult =
  | { canDelete: true }
  | {
      canDelete: false;
      reason: "active_subscriptions";
      activeSubscriptions: number;
      lastSubExpiresAt: Date | null;
    }
  | {
      canDelete: false;
      reason: "scheduled";
      pendingDeletionAt: Date;
      activeSubscriptions: number;
      lastSubExpiresAt: Date | null;
    };

/** État de suppression du compte, affiché dans la section « Confidentialité & données » de /compte. */
export async function getDeletionStatus(userId: string): Promise<DeletionStatusResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      expert: {
        select: { id: true, pendingDeletionAt: true },
      },
    },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  if (user.role !== "EXPERT" || !user.expert) {
    return { canDelete: true };
  }

  const expertId = user.expert.id;

  // Tri par échéance décroissante : [0] est la dernière à expirer.
  const activeSubs = await prisma.subscription.findMany({
    where: {
      expertId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
    select: { expiresAt: true },
  });

  const activeSubsCount = activeSubs.length;
  const lastActiveSub = activeSubs[0] ?? null;

  if (user.expert.pendingDeletionAt) {
    return {
      canDelete: false,
      reason: "scheduled",
      pendingDeletionAt: user.expert.pendingDeletionAt,
      activeSubscriptions: activeSubsCount,
      lastSubExpiresAt: lastActiveSub?.expiresAt ?? null,
    };
  }

  if (activeSubsCount > 0) {
    return {
      canDelete: false,
      reason: "active_subscriptions",
      activeSubscriptions: activeSubsCount,
      lastSubExpiresAt: lastActiveSub?.expiresAt ?? null,
    };
  }

  return { canDelete: true };
}

export type DeleteAccountResult =
  | { status: "deleted" }
  | { status: "scheduled"; pendingDeletionAt: Date; lastSubExpiresAt: Date };

/**
 * Suppression RGPD :
 *  - utilisateur, ou expert sans abonné actif : soft delete immédiat
 *    (email anonymisé, sessions supprimées, cooldown de 7 jours) ;
 *  - expert avec abonnés actifs : suppression programmée, finalisée par le
 *    cron après la dernière échéance.
 * DeletionAlreadyScheduledError si une suppression est déjà programmée.
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      expert: {
        select: { id: true, pendingDeletionAt: true },
      },
    },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  const now = new Date();

  // Expert avec abonnés actifs : suppression programmée.
  if (user.role === "EXPERT" && user.expert) {
    if (user.expert.pendingDeletionAt) {
      throw new DeletionAlreadyScheduledError();
    }

    const lastActiveSub = await prisma.subscription.findFirst({
      where: {
        expertId: user.expert.id,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
      select: { expiresAt: true },
    });

    if (lastActiveSub) {
      // Les abonnements mensuels de ses abonnés ne doivent plus se
      // renouveler : sinon Stripe continuerait à prélever pour un expert qui
      // part, et la suppression ne serait jamais finalisée.
      const recurringSubs = await prisma.subscription.findMany({
        where: {
          expertId: user.expert.id,
          type: "MONTHLY",
          status: "ACTIVE",
          cancelAtPeriodEnd: false,
          stripeSubId: { not: null },
        },
        select: { id: true, stripeSubId: true },
      });
      for (const sub of recurringSubs) {
        await cancelSubscriptionAtPeriodEnd(sub.stripeSubId as string);
      }
      if (recurringSubs.length > 0) {
        await prisma.subscription.updateMany({
          where: { id: { in: recurringSubs.map((s) => s.id) } },
          data: { cancelAtPeriodEnd: true },
        });
      }

      await prisma.expert.update({
        where: { id: user.expert.id },
        data: { pendingDeletionAt: now },
      });

      logger.warn(
        {
          userId,
          expertId: user.expert.id,
          lastSubExpiresAt: lastActiveSub.expiresAt,
        },
        "Expert account deletion scheduled (pending — active subs)",
      );

      return {
        status: "scheduled",
        pendingDeletionAt: now,
        lastSubExpiresAt: lastActiveSub.expiresAt,
      };
    }
  }

  // Sinon : suppression immédiate.
  await softDeleteUserNow({
    userId,
    email: user.email,
    expertId: user.expert?.id ?? null,
    now,
  });

  logger.warn({ userId, role: user.role, hadExpert: !!user.expert }, "User account deleted (RGPD)");

  return { status: "deleted" };
}

/**
 * Soft delete d'un utilisateur (et de son profil expert) : abonnements Stripe
 * récurrents arrêtés, puis en une transaction deletedAt, email anonymisé,
 * cooldown, magic-links et sessions supprimés. Partagé avec le cron de
 * finalisation des suppressions programmées (lib/cron.ts).
 */
export async function softDeleteUserNow(input: {
  userId: string;
  email: string;
  expertId: string | null;
  now: Date;
}): Promise<void> {
  const { userId, email, expertId, now } = input;
  const anonymizedEmail = `deleted-${userId}@plarya.local`;
  const cooldownExpiresAt = new Date(now.getTime() + COOLDOWN_MS);

  // Arrêter la facturation AVANT de supprimer : un échec Stripe laisse le
  // compte intact (l'utilisateur peut réessayer) au lieu d'un compte supprimé
  // qui continuerait à être prélevé.
  const ownRecurringSubs = await prisma.subscription.findMany({
    where: { userId, type: "MONTHLY", status: "ACTIVE", stripeSubId: { not: null } },
    select: { id: true, stripeSubId: true },
  });
  for (const sub of ownRecurringSubs) {
    await cancelSubscriptionNow(sub.stripeSubId as string);
  }
  const expertSub = expertId
    ? await prisma.expert.findUnique({ where: { id: expertId }, select: { stripeSubId: true } })
    : null;
  if (expertSub?.stripeSubId) {
    await cancelSubscriptionNow(expertSub.stripeSubId);
  }

  await prisma.$transaction(async (tx) => {
    if (ownRecurringSubs.length > 0) {
      await tx.subscription.updateMany({
        where: { id: { in: ownRecurringSubs.map((s) => s.id) } },
        data: { status: "CANCELLED" },
      });
    }
    if (expertId) {
      await tx.expert.update({
        where: { id: expertId },
        data: {
          deletedAt: now,
          pendingDeletionAt: null,
          ...(expertSub?.stripeSubId ? { subStatus: "EXPIRED" as const } : {}),
        },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: { deletedAt: now, email: anonymizedEmail },
    });
    await tx.deletedEmailCooldown.create({
      data: { email, deletedAt: now, expiresAt: cooldownExpiresAt },
    });
    // Un lien émis juste avant resterait sinon valide 15 minutes.
    await tx.magicLink.deleteMany({ where: { email } });
    await tx.session.deleteMany({ where: { userId } });
  });
}

/** Échoue si aucune suppression n'est programmée ou si elle est déjà finalisée. */
export async function cancelScheduledDeletion(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      expert: {
        select: { id: true, pendingDeletionAt: true, deletedAt: true },
      },
    },
  });

  if (!user || !user.expert || user.expert.deletedAt) {
    throw new NoDeletionToCancelError();
  }

  if (!user.expert.pendingDeletionAt) {
    throw new NoScheduledDeletionError();
  }

  await prisma.expert.update({
    where: { id: user.expert.id },
    data: { pendingDeletionAt: null },
  });

  logger.info({ userId, expertId: user.expert.id }, "Expert account deletion cancelled");
}

/** Utilisateur de /auth/me ; UserNotFoundError s'il est supprimé (en plus de l'effacement des sessions). */
export type ActiveUser = { id: string; email: string; role: UserRole };

export async function getActiveUser(userId: string): Promise<ActiveUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new UserNotFoundError();
  }

  return { id: user.id, email: user.email, role: user.role };
}

// Export RGPD. `as const` garde les littéraux `true`, nécessaires pour
// dériver le type exact via Prisma.UserGetPayload.
const exportUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  deletedAt: true,
  stripeCustomerId: true,
  expert: {
    select: {
      id: true,
      pseudo: true,
      bio: true,
      photoUrl: true,
      sports: true,
      dayPassPrice: true,
      monthlyPrice: true,
      subStatus: true,
      subExpiresAt: true,
      displayOrder: true,
      viewsToday: true,
      createdAt: true,
      updatedAt: true,
      pronos: {
        select: {
          id: true,
          matchName: true,
          league: true,
          pick: true,
          odds: true,
          teasing: true,
          result: true,
          argument: true,
          startTime: true,
          matchDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  },
  subscriptions: {
    select: {
      id: true,
      type: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      expert: { select: { id: true, pseudo: true } },
    },
    orderBy: { createdAt: "desc" },
  },
} as const;

type ExportUserRow = Prisma.UserGetPayload<{ select: typeof exportUserSelect }>;

export type UserDataExport = {
  exportDate: string;
  user: Pick<ExportUserRow, "id" | "email" | "role" | "createdAt" | "stripeCustomerId">;
  expertProfile: ExportUserRow["expert"];
  subscriptions: ExportUserRow["subscriptions"];
};

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: exportUserSelect,
  });

  if (!user || user.deletedAt) {
    throw new UserNotFoundError();
  }

  logger.info({ userId }, "User data exported (RGPD)");

  return {
    exportDate: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      stripeCustomerId: user.stripeCustomerId,
    },
    expertProfile: user.expert ?? null,
    subscriptions: user.subscriptions,
  };
}
