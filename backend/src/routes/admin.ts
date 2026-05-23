import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { validate } from "../middleware/validate";
import { createExpertSchema, warningSchema, displayOrderSchema } from "../validators/expert";
import { updateResultSchema } from "../validators/prono";
import { sendDailyWinningEmails } from "../lib/cron";

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /admin/experts — List all experts
router.get("/experts", async (_req, res) => {
  try {
    const experts = await prisma.expert.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { pronos: true, subscriptions: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    res.json(experts);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/users — List all users
router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /admin/experts — Create an expert account
router.post("/experts", validate(createExpertSchema), async (req, res) => {
  try {
    const { email, pseudo, bio, sports, subStatus } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email déjà utilisé" });
      return;
    }

    const user = await prisma.user.create({
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

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/pronos?limit=50&offset=0 — Liste paginée des pronos.
//
// Sans pagination, à 10k+ pronos le payload pesait des centaines de
// Ko et bloquait l'UI admin. Defaults choisis pour tenir confortable
// dans une page admin (50 = ~3 scroll-pages, raisonnable).
//
// Cap dur `MAX_LIMIT` = 200 pour éviter qu'un client malicieux ou
// buggé demande limit=99999 et fasse exploser le payload.
router.get("/pronos", async (req, res) => {
  try {
    const MAX_LIMIT = 200;
    const DEFAULT_LIMIT = 50;

    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT),
    );
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    // Total + page en parallèle (countDistinct n'est pas nécessaire
    // ici, prono.id est PK donc count() suffit).
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

    res.json({
      items,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /admin/pronos/:id/result — Override prono result
router.patch("/pronos/:id/result", validate(updateResultSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    const prono = await prisma.prono.findUnique({ where: { id } });
    if (!prono) {
      res.status(404).json({ error: "Prono introuvable" });
      return;
    }

    const updated = await prisma.prono.update({
      where: { id },
      data: { result: req.body.result },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /admin/experts/:id/warning — Add/remove warning on expert profile
router.patch("/experts/:id/warning", validate(warningSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    const expert = await prisma.expert.findUnique({ where: { id } });
    if (!expert) {
      res.status(404).json({ error: "Expert introuvable" });
      return;
    }

    const updated = await prisma.expert.update({
      where: { id },
      data: { warningMessage: req.body.warningMessage },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/stats — Global stats
router.get("/stats", async (_req, res) => {
  try {
    const [usersCount, expertsCount, pronosCount, subscriptionsCount] = await Promise.all([
      prisma.user.count(),
      prisma.expert.count(),
      prisma.prono.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

    // Estimate revenue from active subscriptions. Prix lu sur l'expert
    // lié (et non hardcodé) — cf. audit-final.md §J : chaque expert
    // a son propre prix, hardcoder 1900 produit un total faux dès
    // qu'un expert s'écarte du default.
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
      select: {
        type: true,
        expert: { select: { dayPassPrice: true, monthlyPrice: true } },
      },
    });

    const revenue = activeSubscriptions.reduce((total, sub) => {
      const amount = sub.type === "DAY_PASS" ? sub.expert.dayPassPrice : sub.expert.monthlyPrice;
      return total + amount;
    }, 0);

    res.json({
      usersCount,
      expertsCount,
      pronosCount,
      activeSubscriptionsCount: subscriptionsCount,
      estimatedRevenueCents: revenue,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /admin/experts/:id/display-order — Update expert display order
router.patch("/experts/:id/display-order", validate(displayOrderSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    const expert = await prisma.expert.findUnique({ where: { id } });
    if (!expert) {
      res.status(404).json({ error: "Expert introuvable" });
      return;
    }

    const updated = await prisma.expert.update({
      where: { id },
      data: { displayOrder: req.body.displayOrder },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/stats/revenue — CA par jour (30 derniers jours)
router.get("/stats/revenue", async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        type: true,
        createdAt: true,
        expert: { select: { dayPassPrice: true, monthlyPrice: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const byDay: Record<string, { revenue: number; salesCount: number }> = {};

    // Pre-fill all 30 days
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

    const result = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    res.json(result);
  } catch (err) {
    logger.error({ err, route: "GET /admin/stats/revenue" }, "Admin stats revenue failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/stats/sales — Liste détaillée des ventes
router.get("/stats/sales", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const expertId = req.query.expertId as string | undefined;

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = from;
      if (to) (where.createdAt as Record<string, Date>).lte = to;
    }
    if (expertId) where.expertId = expertId;

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

    const result = sales.map((s) => ({
      id: s.id,
      date: s.createdAt,
      email: s.user.email,
      expertPseudo: s.expert.pseudo,
      type: s.type,
      amount: s.type === "DAY_PASS" ? s.expert.dayPassPrice : s.expert.monthlyPrice,
    }));

    res.json({ sales: result, total });
  } catch (err) {
    logger.error({ err, route: "GET /admin/stats/sales" }, "Admin stats sales failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/stats/by-expert — Revenus par expert
router.get("/stats/by-expert", async (_req, res) => {
  try {
    const experts = await prisma.expert.findMany({
      select: {
        id: true,
        pseudo: true,
        dayPassPrice: true,
        monthlyPrice: true,
        subscriptions: {
          select: { type: true },
        },
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

    // Sort by totalRevenue DESC
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json(result);
  } catch (err) {
    logger.error({ err, route: "GET /admin/stats/by-expert" }, "Admin stats by-expert failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/stats/export.csv — Export CSV des ventes
router.get("/stats/export.csv", async (req, res) => {
  try {
    const from = req.query.from
      ? new Date(req.query.from as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // 1er du mois
    const to = req.query.to ? new Date(req.query.to as string) : new Date();

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

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ventes-${month}.csv"`);
    res.send(csv);
  } catch (err) {
    logger.error({ err, route: "GET /admin/stats/export.csv" }, "Admin CSV export failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /admin/send-daily-emails — Manually trigger J+1 emails
router.post("/send-daily-emails", async (_req, res) => {
  try {
    await sendDailyWinningEmails();
    res.json({ message: "Emails J+1 envoyés avec succès" });
  } catch (err) {
    logger.error({ err }, "Manual J+1 email trigger failed");
    res.status(500).json({ error: "Erreur lors de l'envoi des emails" });
  }
});

export default router;
