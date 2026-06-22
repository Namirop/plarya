import { Prisma } from "../generated/prisma/client";
import type { UserRole } from "../generated/prisma/enums";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

import {
  DeletionAlreadyScheduledError,
  NoDeletionToCancelError,
  NoScheduledDeletionError,
  UserNotFoundError,
} from "./errors";

/**
 * Service Account — opérations de gestion du compte utilisateur :
 * lecture profil, statut de suppression, suppression RGPD avec deux
 * branches (immédiate vs programmée), annulation, export des données.
 *
 * État machine de la suppression d'un compte EXPERT :
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
 * Pour les USER (non-expert) : suppression immédiate toujours. Pas
 * d'état PENDING (rien à protéger côté abonnés).
 *
 * RGPD : on conserve les FK Subscriptions (obligation comptable 10 ans
 * en France). Stripe Customer reste lié à l'ancien email côté Stripe
 * — info conservée pour audit Stripe Dashboard, normal.
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

/**
 * Renvoie l'état actuel de la suppression de compte pour pilotage UI
 * (Zone dangereuse de /compte).
 */
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

  // 1 seule query au lieu de findFirst + count en parallèle : on
  // récupère les subs actives triées par expiration décroissante,
  // count = length, dernière sub = [0].
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
 * Suppression de compte RGPD avec deux branches selon le contexte :
 *
 *  - USER lambda OU EXPERT sans sub active → soft delete immédiat
 *    (anonymisation email + wipe sessions + cooldown 7j sur l'email).
 *  - EXPERT avec ≥1 sub ACTIVE en cours → suppression PROGRAMMÉE
 *    (Expert.pendingDeletionAt posé, le profile sort des listings, les
 *    nouveaux paiements sont refusés ; cron 03:15 finalise quand la
 *    dernière sub a expiré).
 *
 * Throw DeletionAlreadyScheduledError si une suppression est déjà
 * programmée (pas de double-flag).
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

  // Branche EXPERT : programmer si subs actives, sinon delete immédiat
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

  // Branche soft delete immédiat
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
 * Exécute le soft delete réel d'un user (et son expert s'il y a) en
 * une transaction atomique :
 *  - Expert.deletedAt (+ reset pendingDeletionAt si posé)
 *  - User.deletedAt + anonymisation email
 *  - DeletedEmailCooldown create
 *  - magicLink + session wipe
 *
 * Exporté pour permettre la réutilisation depuis le cron
 * auto_delete_pending_experts (cf. lib/cron.ts) — le cron consomme la
 * MÊME logique que le delete immédiat, garantie de cohérence.
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

  await prisma.$transaction(async (tx) => {
    if (expertId) {
      await tx.expert.update({
        where: { id: expertId },
        data: { deletedAt: now, pendingDeletionAt: null },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: { deletedAt: now, email: anonymizedEmail },
    });
    await tx.deletedEmailCooldown.create({
      data: { email, deletedAt: now, expiresAt: cooldownExpiresAt },
    });
    // Invalide les magic-links pending pour cet email (un lien créé
    // juste avant la suppression resterait valide 15 min sinon).
    await tx.magicLink.deleteMany({ where: { email } });
    // Invalide toutes les sessions du user (cookies orphelins → rejet
    // au prochain authMiddleware).
    await tx.session.deleteMany({ where: { userId } });
  });
}

/**
 * Annule une suppression programmée. Échec si rien à annuler ou si
 * le cron a déjà finalisé la suppression.
 */
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

/**
 * Récupère un user actif pour /auth/me — throw UserNotFoundError si
 * soft-deleted (defense in depth, normalement les sessions sont
 * wipées à la suppression).
 */
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

/**
 * Export RGPD complet du compte. Renvoie un payload JSON sérialisable
 * (la route se charge de définir les headers Content-Disposition).
 *
 * Si pas de user trouvé ou soft-deleted : throw UserNotFoundError
 * (cohérence avec /auth/me).
 */
// Select de l'export RGPD extrait en const + `as const` : préserve les
// littéraux `true` (un `satisfies`/inférence simple les élargirait en
// boolean), ce qui permet de dériver le type exact du payload via
// `Prisma.UserGetPayload<{ select: typeof exportUserSelect }>` — même
// pattern que `bookmakerOddsInclude` dans prono-service.
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
