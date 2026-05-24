import { Prisma, type Prono } from "../generated/prisma/client";
import type { UserRole } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import type { CreatePronoInput, UpdateResultInput } from "../validators/prono";

import {
  ExpertProfileNotFoundError,
  NotPronoOwnerError,
  PronoNotFoundError,
  SubscriptionRequiredError,
} from "./errors";

/**
 * Service Prono — toute la logique métier relative aux pronos est ici.
 *
 * Le service ne connaît pas Express : il prend des paramètres typés et
 * retourne des données ou throw des erreurs métier (cf. ./errors.ts).
 * Les routes orchestrent la traduction HTTP en mappant ces erreurs sur
 * des status codes (cf. routes/pronos.ts).
 *
 * Avantages :
 *  - testable isolément (pas de mock req/res)
 *  - réutilisable depuis un cron, un job, ou un autre service
 *  - les routes restent minces et lisibles
 *  - les transactions DB et règles métier (auto-deflag, etc.) sont
 *    centralisées, plus dispersées dans plusieurs handlers
 */

/**
 * Include réutilisable pour récupérer bookmakerOdds + bookmaker +
 * affiliateLinks en une seule query Prisma. Le `as const` préserve
 * l'inférence Prisma (sans lui, Prisma type le résultat comme
 * "Prono sans relations").
 */
export const bookmakerOddsInclude = {
  bookmakerOdds: {
    include: {
      bookmaker: { include: { affiliateLinks: true } },
    },
  },
} as const;

/**
 * Type de retour pour les services qui renvoient un Prono avec ses
 * cotes bookmaker (publishProno, listPronosByExpertId). Généré via
 * `Prisma.PronoGetPayload<{ include: ... }>` — type exact incluant
 * toutes les relations imbriquées, exporté comme contrat consommable
 * par les routes et autres services.
 */
export type PronoWithBookmakers = Prisma.PronoGetPayload<{
  include: typeof bookmakerOddsInclude;
}>;

/**
 * Type de retour pour getPronoDetailForUser — include enrichi avec
 * expert.userId + expert.pseudo (pour les checks d'autorisation et
 * l'affichage) + expert.subscriptions (gating sub active du caller,
 * filtrée à 0 ou 1 row au runtime via le where dynamique).
 *
 * Le `subscriptions: { select: { id: true } }` ci-dessous décrit la
 * SHAPE des rows retournées, pas le WHERE — le filtre runtime est
 * appliqué dans la query.
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

/**
 * Récupère l'Expert lié à un userId.
 *
 * Throw ExpertProfileNotFoundError si :
 *  - l'user n'a pas (encore) de profile expert créé
 *  - le profile est soft-deleted (cohérence RGPD : un compte supprimé
 *    ne doit plus pouvoir agir sur ses anciennes ressources)
 *
 * Sélectionne uniquement `id` par défaut — la majorité des callers
 * n'ont besoin que de l'expertId pour passer aux queries suivantes.
 */
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
 * Crée un prono pour un expert.
 *
 * Règle métier "analyse du jour unique" : si l'input demande
 * `isFeatured: true`, on de-flag toute autre analyse featured du même
 * expert créée aujourd'hui avant l'insert. Sans ça, un expert qui
 * republie une "analyse du jour" verrait l'ancienne et la nouvelle
 * cohabiter avec le badge — l'UI suppose qu'il y en a au plus une.
 *
 * Note : on ne fait PAS de transaction stricte autour du updateMany +
 * create. Le pire cas (interruption entre les deux) laisse un état
 * cohérent : ancienne analyse défoglée + nouvelle non créée. L'expert
 * reposte → on retombe sur ses pieds.
 */
export async function publishProno(
  expertId: string,
  data: CreatePronoInput,
): Promise<PronoWithBookmakers> {
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

/**
 * Liste tous les pronos d'un expert (handler /pronos/mine).
 * Inclut bookmakerOdds pour permettre l'affichage cotes dans le
 * dashboard expert sans round-trip supplémentaire.
 */
export async function listPronosByExpertId(expertId: string): Promise<PronoWithBookmakers[]> {
  return prisma.prono.findMany({
    where: { expertId },
    orderBy: { createdAt: "desc" },
    include: bookmakerOddsInclude,
  });
}

/**
 * Met à jour le résultat d'un prono (WON/LOST).
 *
 * Règle d'autorisation :
 *  - le propriétaire (l'expert qui l'a publié) peut updater
 *  - les ADMIN peuvent override
 *  - tout autre user → ForbiddenError
 *
 * On fait 2 queries (findUnique + update) plutôt qu'un update direct
 * avec WHERE composite. Raison : on veut distinguer "prono inexistant"
 * (404) de "interdit" (403), ce qu'un update direct ne permet pas
 * (un updateMany count=0 est ambigu).
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
 * Récupère le détail d'un prono pour un user authentifié.
 *
 * Règle d'accès :
 *  - propriétaire (l'expert auteur) : accès direct
 *  - ADMIN : accès direct
 *  - autres users : doivent avoir une Subscription ACTIVE non-expirée
 *    sur l'expert auteur
 *
 * Optim : 1 seul round-trip DB. On inclut directement
 * `expert.subscriptions` filtrée sur le caller (where + take: 1).
 * Si la liste retournée est vide, le caller n'a pas de sub active.
 * Avant : 2 queries séparées (findUnique prono + findFirst
 * subscription) — gain net en latence sur le cas le plus chaud
 * (utilisateur abonné qui consulte une analyse).
 *
 * Throw PronoNotFoundError si l'ID n'existe pas (404), ou
 * SubscriptionRequiredError si l'user n'est ni owner ni admin ni
 * abonné (403).
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
          // Sub active du caller filtrée DANS la query principale.
          // take: 1 : on n'a besoin que de connaître l'existence
          // (le contenu de la sub n'est pas exposé au caller).
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
