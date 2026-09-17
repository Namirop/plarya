import { Prisma, type Prono } from "../generated/prisma/client";
import type { UserRole } from "../generated/prisma/enums";
import { isExpertSubscriptionActive } from "../lib/expert-access";
import { prisma } from "../lib/prisma";
import type { CreatePronoInput, UpdateResultInput } from "../validators/prono";

import {
  ExpertProfileNotFoundError,
  ExpertSubscriptionInactiveError,
  NotPronoOwnerError,
  PronoNotFoundError,
  SubscriptionRequiredError,
} from "./errors";

// Logique métier des pronos, indépendante d'Express (erreurs typées de ./errors.ts).

// Cotes par bookmaker et liens d'affiliation en une requête. `as const` est
// nécessaire pour que Prisma infère les relations incluses.
export const bookmakerOddsInclude = {
  bookmakerOdds: {
    include: {
      bookmaker: { include: { affiliateLinks: true } },
    },
  },
} as const;

export type PronoWithBookmakers = Prisma.PronoGetPayload<{
  include: typeof bookmakerOddsInclude;
}>;

/**
 * Résultat de getPronoDetailForUser. `subscriptions` ne décrit que la forme :
 * la requête la filtre sur l'abonnement actif de l'appelant (0 ou 1 ligne).
 */
export type PronoDetailPayload = Prisma.PronoGetPayload<{
  include: {
    expert: {
      select: {
        userId: true;
        pseudo: true;
        subscriptions: { select: { id: true } };
      };
    };
    bookmakerOdds: {
      include: {
        bookmaker: { include: { affiliateLinks: true } };
      };
    };
  };
}>;

/** Id de l'expert d'un utilisateur ; ExpertProfileNotFoundError si absent ou supprimé. */
export async function getExpertByUserIdOrThrow(userId: string): Promise<{ id: string }> {
  const expert = await prisma.expert.findUnique({
    where: { userId },
    select: { id: true, deletedAt: true },
  });

  if (!expert || expert.deletedAt) {
    throw new ExpertProfileNotFoundError();
  }

  return { id: expert.id };
}

/**
 * Publie un prono (abonnement expert actif requis, sinon
 * ExpertSubscriptionInactiveError). Une seule « analyse du jour » par expert :
 * publier la nouvelle retire le badge des précédentes du jour. Sans
 * transaction, une interruption laisse au pire aucune analyse du jour.
 */
export async function publishProno(
  expertId: string,
  data: CreatePronoInput,
): Promise<PronoWithBookmakers> {
  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    select: { subStatus: true, subExpiresAt: true },
  });
  if (!expert) {
    throw new ExpertProfileNotFoundError();
  }
  if (!isExpertSubscriptionActive(expert)) {
    throw new ExpertSubscriptionInactiveError();
  }

  if (data.isFeatured) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    await prisma.prono.updateMany({
      where: {
        expertId,
        isFeatured: true,
        createdAt: { gte: todayStart },
      },
      data: { isFeatured: false },
    });
  }

  const { bookmakerOdds, startTime, matchDate, ...pronoData } = data;

  return prisma.prono.create({
    data: {
      expertId,
      ...pronoData,
      startTime: new Date(startTime),
      matchDate: matchDate ? new Date(matchDate) : undefined,
      ...(bookmakerOdds && bookmakerOdds.length > 0
        ? { bookmakerOdds: { create: bookmakerOdds } }
        : {}),
    },
    include: bookmakerOddsInclude,
  });
}

/** Pronos de l'expert connecté (/pronos/mine), cotes comprises. */
export async function listPronosByExpertId(expertId: string): Promise<PronoWithBookmakers[]> {
  return prisma.prono.findMany({
    where: { expertId },
    orderBy: { createdAt: "desc" },
    include: bookmakerOddsInclude,
  });
}

/**
 * Résultat (WON/LOST), modifiable par l'auteur ou un admin. Lecture puis mise
 * à jour, pour distinguer un prono inexistant (404) d'un accès refusé (403).
 */
export async function updatePronoResult(
  pronoId: string,
  data: UpdateResultInput,
  caller: { userId: string; role: UserRole },
): Promise<Prono> {
  const prono = await prisma.prono.findUnique({
    where: { id: pronoId },
    include: { expert: { select: { userId: true } } },
  });

  if (!prono) {
    throw new PronoNotFoundError();
  }

  const isOwner = prono.expert.userId === caller.userId;
  const isAdmin = caller.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw new NotPronoOwnerError();
  }

  return prisma.prono.update({
    where: { id: pronoId },
    data: { result: data.result },
  });
}

/**
 * Détail d'un prono pour l'auteur, un admin ou un abonné actif
 * (SubscriptionRequiredError, 403, sinon ; PronoNotFoundError, 404). L'abonnement
 * de l'appelant est lu dans la même requête.
 */
export async function getPronoDetailForUser(
  pronoId: string,
  caller: { userId: string; role: UserRole },
): Promise<PronoDetailPayload> {
  const prono = await prisma.prono.findUnique({
    where: { id: pronoId },
    include: {
      expert: {
        select: {
          userId: true,
          pseudo: true,
          // Seule l'existence d'un abonnement actif compte.
          subscriptions: {
            where: {
              userId: caller.userId,
              status: "ACTIVE",
              expiresAt: { gt: new Date() },
            },
            select: { id: true },
            take: 1,
          },
        },
      },
      ...bookmakerOddsInclude,
    },
  });

  if (!prono) {
    throw new PronoNotFoundError();
  }

  const isOwner = prono.expert.userId === caller.userId;
  const isAdmin = caller.role === "ADMIN";
  const hasActiveSubscription = prono.expert.subscriptions.length > 0;

  if (!isOwner && !isAdmin && !hasActiveSubscription) {
    throw new SubscriptionRequiredError();
  }

  return prono;
}
