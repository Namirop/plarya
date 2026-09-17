import { Prisma, type Expert, type Prono } from "../generated/prisma/client";
import type { SubscriptionType } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import type { PaginationQuery, SalesExportQuery, SalesFilterQuery } from "../validators/admin";
import type { CreateExpertInput, DisplayOrderInput, WarningInput } from "../validators/expert";
import type { UpdateResultInput } from "../validators/prono";

import { EmailAlreadyUsedError, ExpertNotFoundError, PronoNotFoundError } from "./errors";

/**
 * Opérations exposées via /admin/*. Le rôle est vérifié par les middlewares
 * de routes/admin.ts, et les paramètres de pagination/filtre arrivent déjà
 * validés et convertis (validators/admin.ts).
 */

// ── Types de retour exportés (contrats consommés par les routes) ─────

export type AdminExpertListItem = Prisma.ExpertGetPayload<{
  include: {
    user: { select: { email: true } };
    _count: { select: { pronos: true; subscriptions: true } };
  };
}>;

export type AdminUserListItem = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    role: true;
    createdAt: true;
    _count: { select: { subscriptions: true } };
  };
}>;

export type AdminCreatedExpert = Prisma.UserGetPayload<{ include: { expert: true } }>;

export type AdminPronoListItem = Prisma.PronoGetPayload<{
  include: { expert: { select: { pseudo: true } } };
}>;

export type PaginatedPronos = {
  items: AdminPronoListItem[];
  meta: { total: number; limit: number; offset: number; hasMore: boolean };
};

export type GlobalStats = {
  usersCount: number;
  expertsCount: number;
  pronosCount: number;
  activeSubscriptionsCount: number;
  estimatedRevenueCents: number;
};

export type RevenueByDay = { date: string; revenue: number; salesCount: number };

export type SalesItem = {
  id: string;
  date: Date;
  email: string;
  expertPseudo: string;
  type: SubscriptionType;
  amount: number;
};

export type PaginatedSales = { sales: SalesItem[]; total: number };

export type ExpertRevenue = {
  expertId: string;
  pseudo: string;
  salesCount: number;
  totalRevenue: number;
  expertShare: number;
};

// ── Experts ─────────────────────────────────────────────────────────

export async function listAllExperts(): Promise<AdminExpertListItem[]> {
  return prisma.expert.findMany({
    include: {
      user: { select: { email: true } },
      _count: { select: { pronos: true, subscriptions: true } },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function listAllUsers(): Promise<AdminUserListItem[]> {
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
export async function createExpertAccount(input: CreateExpertInput): Promise<AdminCreatedExpert> {
  const { email, pseudo, bio, sports, subStatus, dayPassPrice, monthlyPrice } = input;

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
          ...(dayPassPrice !== undefined ? { dayPassPrice } : {}),
          ...(monthlyPrice !== undefined ? { monthlyPrice } : {}),
        },
      },
    },
    include: { expert: true },
  });
}

export async function setExpertWarning(expertId: string, input: WarningInput): Promise<Expert> {
  const expert = await prisma.expert.findUnique({ where: { id: expertId } });
  if (!expert) {
    throw new ExpertNotFoundError();
  }
  return prisma.expert.update({
    where: { id: expertId },
    data: { warningMessage: input.warningMessage },
  });
}

export async function setExpertDisplayOrder(
  expertId: string,
  input: DisplayOrderInput,
): Promise<Expert> {
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

export async function listPronosPaginated(input: PaginationQuery): Promise<PaginatedPronos> {
  const { limit, offset } = input;

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

export async function overridePronoResult(pronoId: string, input: UpdateResultInput): Promise<Prono> {
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
 * chaque sub active (prix lu sur l'expert lié, pas hardcodé).
 */
export async function getGlobalStats(): Promise<GlobalStats> {
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
 * CA par jour sur 30 jours, série continue : les jours sans vente sont
 * présents à 0 (jours calculés en UTC).
 */
export async function getRevenueByDay(): Promise<RevenueByDay[]> {
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

/** Ventes paginées, filtrables par période (from/to) et par expert. */
export async function listSalesPaginated(input: SalesFilterQuery): Promise<PaginatedSales> {
  const { limit, offset, from, to, expertId } = input;

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
 * Revenus cumulés par expert sur tout l'historique, avec la part qui lui
 * revient (`expertShare`). Montants recalculés au prix actuel de l'expert.
 */
export async function getRevenueByExpert(): Promise<ExpertRevenue[]> {
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
 * Cellule CSV : entre guillemets (les montants au format français contiennent
 * une virgule), guillemets doublés, et préfixe `'` devant = + - @ pour qu'un
 * tableur n'interprète pas un email ou un pseudo comme une formule.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Export CSV des ventes entre `from` et `to` (par défaut : du 1er du mois
 * courant à maintenant). Montants au format français (virgule décimale, €).
 */
export async function buildSalesCsv(input: SalesExportQuery): Promise<{
  csv: string;
  month: string;
}> {
  const from = input.from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = input.to ?? new Date();

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
    return [date, s.user.email, s.expert.pseudo, s.type, `${amountStr}€`, `${expertShareStr}€`, `${platformShareStr}€`]
      .map(csvCell)
      .join(",");
  });

  const csv = [header, ...rows].join("\n");
  const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
  return { csv, month };
}
