import { prisma } from "../lib/prisma";
import type { CreateExpertInput, DisplayOrderInput, WarningInput } from "../validators/expert";
import type { UpdateResultInput } from "../validators/prono";

import { EmailAlreadyUsedError, ExpertNotFoundError, PronoNotFoundError } from "./errors";

/**
 * Service Admin — opérations privilégiées exposées via /admin/*.
 *
 * Toutes les routes admin sont déjà gatées en amont par
 * `authMiddleware + adminMiddleware` (cf. routes/admin.ts) — les
 * services ici n'ont donc pas à revérifier le rôle.
 *
 * Convention de pagination : les caps (MAX_LIMIT, defaults) sont
 * définis ICI plutôt que dans le route (la règle métier "ne pas
 * exposer plus de 200 lignes en une page" n'est pas une décision
 * HTTP — un cron qui veut paginer hériterait du même cap).
 */

const MAX_PAGINATION_LIMIT = 200;
const DEFAULT_PAGINATION_LIMIT = 50;

/** Clamp un nombre dans [min, max]. */
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Normalise les params de pagination depuis les query strings. Renvoie
 * { limit, offset } toujours dans des bornes safe :
 *  - limit ∈ [1, MAX_PAGINATION_LIMIT], default DEFAULT_PAGINATION_LIMIT
 *  - offset ≥ 0, default 0
 *
 * Acceptable côté MVP — pour une V2 stricte, valider via Zod avec un
 * validateQuery() middleware générique.
 */
export function parsePagination(input: { limit?: string; offset?: string }): {
  limit: number;
  offset: number;
} {
  const limitRaw = parseInt(input.limit ?? "");
  const offsetRaw = parseInt(input.offset ?? "");
  return {
    limit: clamp(
      Number.isNaN(limitRaw) ? DEFAULT_PAGINATION_LIMIT : limitRaw,
      1,
      MAX_PAGINATION_LIMIT,
    ),
    offset: Number.isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw),
  };
}

// ── Experts ─────────────────────────────────────────────────────────

export async function listAllExperts() {
  return prisma.expert.findMany({
    include: {
      user: { select: { email: true } },
      _count: { select: { pronos: true, subscriptions: true } },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function listAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { subscriptions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Crée un Expert + son User en une transaction implicite (Prisma
 * nested create). 409 si l'email est déjà pris.
 */
export async function createExpertAccount(input: CreateExpertInput) {
  const { email, pseudo, bio, sports, subStatus } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new EmailAlreadyUsedError();
  }

  return prisma.user.create({
    data: {
      email,
      role: "EXPERT",
      expert: {
        create: {
          pseudo,
          bio,
          sports,
          subStatus: subStatus || "FREE",
        },
      },
    },
    include: { expert: true },
  });
}

export async function setExpertWarning(expertId: string, input: WarningInput) {
  const expert = await prisma.expert.findUnique({ where: { id: expertId } });
  if (!expert) {
    throw new ExpertNotFoundError();
  }
  return prisma.expert.update({
    where: { id: expertId },
    data: { warningMessage: input.warningMessage },
  });
}

export async function setExpertDisplayOrder(expertId: string, input: DisplayOrderInput) {
  const expert = await prisma.expert.findUnique({ where: { id: expertId } });
  if (!expert) {
    throw new ExpertNotFoundError();
  }
  return prisma.expert.update({
    where: { id: expertId },
    data: { displayOrder: input.displayOrder },
  });
}

// ── Pronos (override admin) ─────────────────────────────────────────

export async function listPronosPaginated(input: { limit?: string; offset?: string }) {
  const { limit, offset } = parsePagination(input);

  const [total, items] = await Promise.all([
    prisma.prono.count(),
    prisma.prono.findMany({
      include: {
        expert: { select: { pseudo: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    items,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  };
}

export async function overridePronoResult(pronoId: string, input: UpdateResultInput) {
  const prono = await prisma.prono.findUnique({ where: { id: pronoId } });
  if (!prono) {
    throw new PronoNotFoundError();
  }
  return prisma.prono.update({
    where: { id: pronoId },
    data: { result: input.result },
  });
}

// ── Stats ───────────────────────────────────────────────────────────

/**
 * Stats globales. `estimatedRevenueCents` = somme du prix actuel de
 * chaque sub active (prix lu sur l'expert lié, pas hardcodé — cf.
 * audit-final.md §J).
 */
export async function getGlobalStats() {
  const [usersCount, expertsCount, pronosCount, activeSubscriptionsCount] = await Promise.all([
    prisma.user.count(),
    prisma.expert.count(),
    prisma.prono.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
    select: {
      type: true,
      expert: { select: { dayPassPrice: true, monthlyPrice: true } },
    },
  });

  const estimatedRevenueCents = activeSubscriptions.reduce((total, sub) => {
    const amount = sub.type === "DAY_PASS" ? sub.expert.dayPassPrice : sub.expert.monthlyPrice;
    return total + amount;
  }, 0);

  return {
    usersCount,
    expertsCount,
    pronosCount,
    activeSubscriptionsCount,
    estimatedRevenueCents,
  };
}

/**
 * CA par jour sur les 30 derniers jours. Pré-remplit les 30 buckets
 * pour avoir une série continue (un jour à 0 ventes apparaît avec
 * revenue=0 / salesCount=0 — sans pré-remplissage, le frontend devrait
 * fabriquer les trous lui-même).
 */
export async function getRevenueByDay() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const subscriptions = await prisma.subscription.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      type: true,
      createdAt: true,
      expert: { select: { dayPassPrice: true, monthlyPrice: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byDay: Record<string, { revenue: number; salesCount: number }> = {};

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { revenue: 0, salesCount: 0 };
  }

  for (const sub of subscriptions) {
    const key = sub.createdAt.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { revenue: 0, salesCount: 0 };
    const amount = sub.type === "DAY_PASS" ? sub.expert.dayPassPrice : sub.expert.monthlyPrice;
    byDay[key].revenue += amount;
    byDay[key].salesCount += 1;
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}

/**
 * Liste paginée des ventes avec filtres optionnels (from/to/expertId).
 * Le type du filtre `where` est explicitement Prisma.SubscriptionWhereInput
 * via inférence — pas de `Record<string, unknown>` qui éteignait la
 * type-safety dans le code initial.
 */
export async function listSalesPaginated(input: {
  limit?: string;
  offset?: string;
  from?: string;
  to?: string;
  expertId?: string;
}) {
  const limit = clamp(
    parseInt(input.limit ?? "") || DEFAULT_PAGINATION_LIMIT,
    1,
    MAX_PAGINATION_LIMIT,
  );
  const offset = Math.max(0, parseInt(input.offset ?? "") || 0);

  const from = input.from ? new Date(input.from) : undefined;
  const to = input.to ? new Date(input.to) : undefined;
  const expertId = input.expertId;

  const where = {
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
    ...(expertId && { expertId }),
  };

  const [sales, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      select: {
        id: true,
        type: true,
        createdAt: true,
        user: { select: { email: true } },
        expert: { select: { pseudo: true, dayPassPrice: true, monthlyPrice: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.subscription.count({ where }),
  ]);

  const items = sales.map((s) => ({
    id: s.id,
    date: s.createdAt,
    email: s.user.email,
    expertPseudo: s.expert.pseudo,
    type: s.type,
    amount: s.type === "DAY_PASS" ? s.expert.dayPassPrice : s.expert.monthlyPrice,
  }));

  return { sales: items, total };
}

/**
 * Revenus cumulés par expert (toutes les subs de l'historique). Sert
 * à calculer la part 70% à reverser à chaque expert (en V1, virement
 * bancaire mensuel par l'admin).
 */
export async function getRevenueByExpert() {
  const experts = await prisma.expert.findMany({
    select: {
      id: true,
      pseudo: true,
      dayPassPrice: true,
      monthlyPrice: true,
      subscriptions: { select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = experts.map((e) => {
    const totalRevenue = e.subscriptions.reduce((sum, sub) => {
      return sum + (sub.type === "DAY_PASS" ? e.dayPassPrice : e.monthlyPrice);
    }, 0);

    return {
      expertId: e.id,
      pseudo: e.pseudo,
      salesCount: e.subscriptions.length,
      totalRevenue,
      expertShare: Math.round(totalRevenue * 0.7),
    };
  });

  result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  return result;
}

/**
 * Export CSV des ventes sur une fenêtre `from→to`. Defaults : du 1er
 * du mois courant à maintenant. Le formattage FR (virgule décimale,
 * suffixe €) est intentionnel — le destinataire est un tableur Excel
 * en FR locale pour le reversement comptable.
 */
export async function buildSalesCsv(input: { from?: string; to?: string }): Promise<{
  csv: string;
  month: string;
}> {
  const from = input.from
    ? new Date(input.from)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = input.to ? new Date(input.to) : new Date();

  const sales = await prisma.subscription.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: {
      type: true,
      createdAt: true,
      user: { select: { email: true } },
      expert: { select: { pseudo: true, dayPassPrice: true, monthlyPrice: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "Date,Email,Expert,Type,Montant,Part Expert (70%),Part Plateforme (30%)";
  const rows = sales.map((s) => {
    const amount = s.type === "DAY_PASS" ? s.expert.dayPassPrice : s.expert.monthlyPrice;
    const expertShare = Math.round(amount * 0.7);
    const platformShare = amount - expertShare;
    const date = s.createdAt.toISOString().slice(0, 10);
    const amountStr = (amount / 100).toFixed(2).replace(".", ",");
    const expertShareStr = (expertShare / 100).toFixed(2).replace(".", ",");
    const platformShareStr = (platformShare / 100).toFixed(2).replace(".", ",");
    return `${date},${s.user.email},${s.expert.pseudo},${s.type},${amountStr}€,${expertShareStr}€,${platformShareStr}€`;
  });

  const csv = [header, ...rows].join("\n");
  const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
  return { csv, month };
}
