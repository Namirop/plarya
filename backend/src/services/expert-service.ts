import { Prisma } from "../generated/prisma/client";
import type { Sport, UserRole } from "../generated/prisma/enums";
import { activeExpertSubscriptionWhere, isExpertSubscriptionActive } from "../lib/expert-access";
import { prisma } from "../lib/prisma";
import { calcWinRate } from "../lib/stats";
import type { UpdateExpertInput } from "../validators/expert-self";

import {
  ExpertProfileNotFoundError,
  ExpertNotFoundError,
  PronoSubscriptionRequiredError,
  PseudoTakenError,
} from "./errors";
import { bookmakerOddsInclude, type PronoWithBookmakers } from "./prono-service";

/**
 * Profil expert. Les vues publiques et la vue de l'expert connecté ont des
 * types distincts : le taux de réussite n'est jamais exposé publiquement.
 */

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Types de retour ─────────────────────────────────────────────────

export type OwnExpertProfile = {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: Date | null;
  photoUrl: string | null;
  sports: Sport[];
  dayPassPrice: number;
  monthlyPrice: number;
  warningMessage: string | null;
  winRate: number;
  pronosToday: number;
  subscription: {
    status: "FREE" | "ACTIVE" | "EXPIRED";
    // Peut publier, être listé et vendre (cf. lib/expert-access).
    active: boolean;
    expiresAt: Date | null;
    cancelAtPeriodEnd: boolean;
    canCancel: boolean;
  };
};

export type UpdatedExpertProfile = {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: Date | null;
  sports: Sport[];
};

// Pick lu en base puis masqué pour les pronos en attente.
type PublicExpertProno = Prisma.PronoGetPayload<{
  select: {
    id: true;
    matchName: true;
    league: true;
    pick: true;
    odds: true;
    teasing: true;
    result: true;
    startTime: true;
    isFeatured: true;
    matchDate: true;
    createdAt: true;
  };
}>;

export type PublicExpertProfile = {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  photoUrl: string | null;
  sports: Sport[];
  dayPassPrice: number;
  monthlyPrice: number;
  warningMessage: string | null;
  viewsToday: number;
  pendingDeletion: boolean;
  // false si l'expert est en suppression ou si son abonnement expert est arrêté.
  acceptingSubscribers: boolean;
  pronosToday: number;
  // pick null tant que le prono est PENDING.
  pronos: (Omit<PublicExpertProno, "pick"> & { pick: string | null })[];
};

// Listing de l'accueil : jamais de pick.
type PublicExpertListProno = Prisma.PronoGetPayload<{
  select: {
    id: true;
    matchName: true;
    league: true;
    odds: true;
    teasing: true;
    result: true;
    startTime: true;
    isFeatured: true;
    matchDate: true;
    createdAt: true;
  };
}>;

export type PublicExpertListItem = {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  photoUrl: string | null;
  sports: Sport[];
  dayPassPrice: number;
  monthlyPrice: number;
  warningMessage: string | null;
  viewsToday: number;
  pronosToday: number;
  todayPronos: PublicExpertListProno[];
};

/**
 * GET /experts/me : profil, statistiques et abonnement de l'expert connecté.
 * ExpertProfileNotFoundError si le profil est absent ou supprimé.
 */
export async function getOwnExpertProfile(userId: string): Promise<OwnExpertProfile> {
  const expert = await prisma.expert.findUnique({ where: { userId } });

  if (!expert || expert.deletedAt) {
    throw new ExpertProfileNotFoundError();
  }

  const [winRate, pronosToday] = await Promise.all([
    calcWinRate(expert.id),
    prisma.prono.count({
      where: { expertId: expert.id, createdAt: { gte: todayStart() } },
    }),
  ]);

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
    subscription: {
      status: expert.subStatus,
      active: isExpertSubscriptionActive(expert),
      expiresAt: expert.subExpiresAt,
      cancelAtPeriodEnd: expert.subCancelAtPeriodEnd,
      canCancel:
        expert.subStatus === "ACTIVE" && !!expert.stripeSubId && !expert.subCancelAtPeriodEnd,
    },
  };
}

/**
 * PATCH /experts/me : mise à jour partielle. 404 sans profil, PseudoTakenError
 * (400) si le pseudo est pris. Modifier dailyNote met à jour dailyNoteDate.
 */
export async function updateOwnExpertProfile(
  userId: string,
  input: UpdateExpertInput,
): Promise<UpdatedExpertProfile> {
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
 * GET /experts : experts de l'accueil, avec leurs pronos du jour en une seule
 * requête. Sont exclus les experts supprimés, en suppression programmée ou
 * sans abonnement expert actif. La limite (6, sauf `all`) est appliquée en
 * mémoire : la table reste petite.
 */
export async function listPublicExperts(options: { all: boolean }): Promise<PublicExpertListItem[]> {
  const experts = await prisma.expert.findMany({
    where: { deletedAt: null, pendingDeletionAt: null, ...activeExpertSubscriptionWhere() },
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
 * GET /experts/:id : profil public. Le pick n'est visible que pour les pronos
 * tranchés (historique public). 404 si l'expert est supprimé, mais pas en
 * suppression programmée : ses abonnés gardent l'accès ; `acceptingSubscribers`
 * indique au frontend de fermer la vente.
 */
export async function getPublicExpertProfile(expertId: string): Promise<PublicExpertProfile> {
  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    include: { user: { select: { email: true } } },
  });

  if (!expert || expert.deletedAt) {
    throw new ExpertNotFoundError();
  }

  const [pronosToday, rawPronos] = await Promise.all([
    prisma.prono.count({
      where: { expertId: expert.id, createdAt: { gte: todayStart() } },
    }),
    prisma.prono.findMany({
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
    }),
  ]);

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
    acceptingSubscribers: !expert.pendingDeletionAt && isExpertSubscriptionActive(expert),
    pronosToday,
    pronos,
  };
}

/** POST /experts/:id/view. P2025 (enregistrement absent) devient ExpertNotFoundError. */
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
 * GET /experts/:id/pronos : pronos complets, réservés à l'expert lui-même, aux
 * admins et aux abonnés actifs ; PronoSubscriptionRequiredError (403) sinon.
 */
export async function getExpertPronosForUser(
  expertId: string,
  caller: { userId: string; role: UserRole },
): Promise<PronoWithBookmakers[]> {
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
    include: bookmakerOddsInclude,
  });
}
