import { Prisma } from "../generated/prisma/client";
import type { UserRole } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { calcWinRate } from "../lib/stats";
import type { UpdateExpertInput } from "../validators/expert-self";

import {
  ExpertProfileNotFoundError,
  ExpertNotFoundError,
  PronoSubscriptionRequiredError,
  PseudoTakenError,
} from "./errors";

/**
 * Service Expert — logique métier autour du profil expert.
 *
 * Le service ne dépend pas d'Express. Il consomme/produit des shapes
 * typées et throw des erreurs métier (cf. ./errors.ts).
 *
 * Notes d'implémentation :
 *  - On garde le helper `todayStart()` local plutôt qu'un util partagé :
 *    seule logique métier d'expert s'en sert pour l'instant. À extraire
 *    dans lib/date si un 3e consommateur apparaît.
 *  - Les méthodes "public" (visiteur anonyme) renvoient des shapes
 *    distinctes des méthodes "self" (expert loggé) — les champs exposés
 *    diffèrent volontairement (pas de winRate en public, pas de
 *    dailyNoteDate côté listings).
 */

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /experts/me — Profile + stats internes (winRate, pronosToday) de
 * l'expert connecté. Throw ExpertProfileNotFoundError si pas de profile
 * (ou soft-deleted — un compte supprimé ne doit plus accéder à ses
 * anciennes ressources).
 */
export async function getOwnExpertProfile(userId: string) {
  const expert = await prisma.expert.findUnique({ where: { userId } });

  if (!expert || expert.deletedAt) {
    throw new ExpertProfileNotFoundError();
  }

  const winRate = await calcWinRate(expert.id);
  const pronosToday = await prisma.prono.count({
    where: { expertId: expert.id, createdAt: { gte: todayStart() } },
  });

  return {
    id: expert.id,
    pseudo: expert.pseudo,
    bio: expert.bio,
    dailyNote: expert.dailyNote,
    dailyNoteDate: expert.dailyNoteDate,
    photoUrl: expert.photoUrl,
    sports: expert.sports,
    dayPassPrice: expert.dayPassPrice,
    monthlyPrice: expert.monthlyPrice,
    warningMessage: expert.warningMessage,
    winRate,
    pronosToday,
  };
}

/**
 * PATCH /experts/me — Update partiel du profile expert.
 *
 * Règles :
 *  - 404 si le profile n'existe pas
 *  - 400 (PseudoTakenError) si pseudo modifié vers une valeur déjà
 *    utilisée par un autre expert
 *  - dailyNote update bumpe automatiquement dailyNoteDate (le frontend
 *    consomme cette date pour afficher "Note du XX/XX")
 *
 * `Prisma.ExpertUpdateInput` est typé strict — toute typo (ex:
 * `dailyNotes` au lieu de `dailyNote`) crashe tsc plutôt que d'être
 * silently-ignorée par Prisma.
 */
export async function updateOwnExpertProfile(userId: string, input: UpdateExpertInput) {
  const expert = await prisma.expert.findUnique({ where: { userId } });

  if (!expert) {
    throw new ExpertProfileNotFoundError();
  }

  const { pseudo, bio, dailyNote, sports } = input;

  if (pseudo && pseudo !== expert.pseudo) {
    const existing = await prisma.expert.findUnique({ where: { pseudo } });
    if (existing) {
      throw new PseudoTakenError();
    }
  }

  const updateData: Prisma.ExpertUpdateInput = {};
  if (pseudo !== undefined) updateData.pseudo = pseudo;
  if (bio !== undefined) updateData.bio = bio;
  if (sports !== undefined) updateData.sports = sports;
  if (dailyNote !== undefined) {
    updateData.dailyNote = dailyNote;
    updateData.dailyNoteDate = new Date();
  }

  const updated = await prisma.expert.update({
    where: { id: expert.id },
    data: updateData,
  });

  return {
    id: updated.id,
    pseudo: updated.pseudo,
    bio: updated.bio,
    dailyNote: updated.dailyNote,
    dailyNoteDate: updated.dailyNoteDate,
    sports: updated.sports,
  };
}

/**
 * GET /experts — Liste publique des experts pour la homepage.
 *
 * Optim N+1 : une seule query Prisma avec `include` pronos du jour →
 * pronosToday se calcule côté JS (length de l'array). Avant cette
 * refacto, on faisait 2 queries supplémentaires PAR expert (cf. audit
 * Sprint Polish A.6).
 *
 * Filtre `deletedAt: null + pendingDeletionAt: null` : les experts
 * soft-deleted ou en suppression programmée n'apparaissent pas sur la
 * homepage (ils n'acceptent plus de nouveaux abonnés).
 *
 * Le `limit` est appliqué APRÈS la query (slice côté JS) pour
 * simplifier — la table experts reste petite (~dizaines), pas
 * d'optim DB nécessaire ici.
 */
export async function listPublicExperts(options: { all: boolean }) {
  const experts = await prisma.expert.findMany({
    where: { deletedAt: null, pendingDeletionAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    include: {
      pronos: {
        where: { createdAt: { gte: todayStart() } },
        select: {
          id: true,
          matchName: true,
          league: true,
          odds: true,
          teasing: true,
          result: true,
          startTime: true,
          isFeatured: true,
          matchDate: true,
          createdAt: true,
        },
      },
    },
  });

  const enriched = experts.map((e) => ({
    id: e.id,
    pseudo: e.pseudo,
    bio: e.bio,
    dailyNote: e.dailyNote,
    photoUrl: e.photoUrl,
    sports: e.sports,
    dayPassPrice: e.dayPassPrice,
    monthlyPrice: e.monthlyPrice,
    warningMessage: e.warningMessage,
    viewsToday: e.viewsToday,
    pronosToday: e.pronos.length,
    todayPronos: e.pronos,
  }));

  const limit = options.all ? enriched.length : 6;
  return enriched.slice(0, limit);
}

/**
 * GET /experts/:id — Profile public d'un expert avec pronos masqués.
 *
 * Le `pick` des pronos PENDING est strippé (pick=null) — gating
 * publique. Le pick des pronos passés (WON/LOST) est exposé comme
 * track-record public.
 *
 * Throw ExpertNotFoundError si l'expert n'existe pas OU est
 * soft-deleted. Note : on ne 404 PAS sur pendingDeletionAt — les
 * abonnés existants doivent pouvoir continuer à accéder à leurs
 * analyses jusqu'à expiration de leur sub. On expose `pendingDeletion:
 * boolean` pour que le frontend désactive les CTA d'achat.
 */
export async function getPublicExpertProfile(expertId: string) {
  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    include: { user: { select: { email: true } } },
  });

  if (!expert || expert.deletedAt) {
    throw new ExpertNotFoundError();
  }

  const pronosToday = await prisma.prono.count({
    where: { expertId: expert.id, createdAt: { gte: todayStart() } },
  });

  const rawPronos = await prisma.prono.findMany({
    where: { expertId: expert.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      matchName: true,
      league: true,
      pick: true,
      odds: true,
      teasing: true,
      result: true,
      startTime: true,
      isFeatured: true,
      matchDate: true,
      createdAt: true,
    },
  });

  const pronos = rawPronos.map((p) => ({
    ...p,
    pick: p.result === "PENDING" ? null : p.pick,
  }));

  return {
    id: expert.id,
    pseudo: expert.pseudo,
    bio: expert.bio,
    dailyNote: expert.dailyNote,
    photoUrl: expert.photoUrl,
    sports: expert.sports,
    dayPassPrice: expert.dayPassPrice,
    monthlyPrice: expert.monthlyPrice,
    warningMessage: expert.warningMessage,
    viewsToday: expert.viewsToday,
    pendingDeletion: !!expert.pendingDeletionAt,
    pronosToday,
    pronos,
  };
}

/**
 * POST /experts/:id/view — Incrément du compteur viewsToday.
 *
 * Hint sur l'erreur : Prisma renvoie P2025 (Record to update not found)
 * si l'expert n'existe pas → on convertit en ExpertNotFoundError
 * (404). Pour les autres erreurs (DB down, etc.), on laisse remonter
 * pour que le handler logge et renvoie 500.
 */
export async function incrementViewCounter(expertId: string): Promise<void> {
  try {
    await prisma.expert.update({
      where: { id: expertId },
      data: { viewsToday: { increment: 1 } },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new ExpertNotFoundError();
    }
    throw err;
  }
}

/**
 * GET /experts/:id/pronos — Liste complète des pronos d'un expert,
 * gatée derrière une subscription active (ou owner/admin).
 *
 * Règle d'accès :
 *  - propriétaire (l'expert auteur) : accès direct
 *  - ADMIN : accès direct
 *  - autre user : doit avoir une Subscription ACTIVE non-expirée
 *
 * Throw PronoSubscriptionRequiredError (403) si user authentifié sans
 * sub et sans owner/admin status.
 */
export async function getExpertPronosForUser(
  expertId: string,
  caller: { userId: string; role: UserRole },
) {
  const [subscription, expert] = await Promise.all([
    prisma.subscription.findFirst({
      where: {
        userId: caller.userId,
        expertId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    }),
    prisma.expert.findUnique({
      where: { id: expertId },
      select: { userId: true },
    }),
  ]);

  const isOwner = expert?.userId === caller.userId;
  const isAdmin = caller.role === "ADMIN";

  if (!subscription && !isOwner && !isAdmin) {
    throw new PronoSubscriptionRequiredError();
  }

  return prisma.prono.findMany({
    where: { expertId },
    orderBy: { createdAt: "desc" },
    include: {
      bookmakerOdds: {
        include: {
          bookmaker: { include: { affiliateLinks: true } },
        },
      },
    },
  });
}
