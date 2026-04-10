import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { validate } from "../middleware/validate";
import { createTipsterSchema, warningSchema, displayOrderSchema } from "../validators/tipster";
import { updateResultSchema } from "../validators/prono";
import { sendDailyWinningEmails } from "../lib/cron";

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /admin/tipsters — List all tipsters
router.get("/tipsters", async (_req, res) => {
  try {
    const tipsters = await prisma.tipster.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { pronos: true, subscriptions: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    res.json(tipsters);
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

// POST /admin/tipsters — Create a tipster account
router.post("/tipsters", validate(createTipsterSchema), async (req, res) => {
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
        role: "TIPSTER",
        tipster: {
          create: {
            pseudo,
            bio,
            sports,
            subStatus: subStatus || "FREE",
          },
        },
      },
      include: { tipster: true },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/pronos — List all pronos
router.get("/pronos", async (_req, res) => {
  try {
    const pronos = await prisma.prono.findMany({
      include: {
        tipster: { select: { pseudo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(pronos);
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

// PATCH /admin/tipsters/:id/warning — Add/remove warning on tipster profile
router.patch("/tipsters/:id/warning", validate(warningSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    const tipster = await prisma.tipster.findUnique({ where: { id } });
    if (!tipster) {
      res.status(404).json({ error: "Tipster introuvable" });
      return;
    }

    const updated = await prisma.tipster.update({
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
    const [usersCount, tipstersCount, pronosCount, subscriptionsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.tipster.count(),
        prisma.prono.count(),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
      ]);

    // Estimate revenue from active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
      select: { type: true },
    });

    const revenue = activeSubscriptions.reduce((total, sub) => {
      return total + (sub.type === "DAY_PASS" ? 300 : 1900);
    }, 0);

    res.json({
      usersCount,
      tipstersCount,
      pronosCount,
      activeSubscriptionsCount: subscriptionsCount,
      estimatedRevenueCents: revenue,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /admin/tipsters/:id/display-order — Update tipster display order
router.patch("/tipsters/:id/display-order", validate(displayOrderSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    const tipster = await prisma.tipster.findUnique({ where: { id } });
    if (!tipster) {
      res.status(404).json({ error: "Tipster introuvable" });
      return;
    }

    const updated = await prisma.tipster.update({
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
        tipster: { select: { dayPassPrice: true, monthlyPrice: true } },
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
      const amount = sub.type === "DAY_PASS"
        ? sub.tipster.dayPassPrice
        : sub.tipster.monthlyPrice;
      byDay[key].revenue += amount;
      byDay[key].salesCount += 1;
    }

    const result = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    res.json(result);
  } catch (err) {
    console.error("GET /admin/stats/revenue error:", err);
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
    const tipsterId = req.query.tipsterId as string | undefined;

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = from;
      if (to) (where.createdAt as Record<string, Date>).lte = to;
    }
    if (tipsterId) where.tipsterId = tipsterId;

    const [sales, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        select: {
          id: true,
          type: true,
          createdAt: true,
          user: { select: { email: true } },
          tipster: { select: { pseudo: true, dayPassPrice: true, monthlyPrice: true } },
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
      tipsterPseudo: s.tipster.pseudo,
      type: s.type,
      amount: s.type === "DAY_PASS" ? s.tipster.dayPassPrice : s.tipster.monthlyPrice,
    }));

    res.json({ sales: result, total });
  } catch (err) {
    console.error("GET /admin/stats/sales error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/stats/by-tipster — Revenus par expert
router.get("/stats/by-tipster", async (_req, res) => {
  try {
    const tipsters = await prisma.tipster.findMany({
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

    const result = tipsters.map((t) => {
      const totalRevenue = t.subscriptions.reduce((sum, sub) => {
        return sum + (sub.type === "DAY_PASS" ? t.dayPassPrice : t.monthlyPrice);
      }, 0);

      return {
        tipsterId: t.id,
        pseudo: t.pseudo,
        salesCount: t.subscriptions.length,
        totalRevenue,
        tipsterShare: Math.round(totalRevenue * 0.7),
      };
    });

    // Sort by totalRevenue DESC
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json(result);
  } catch (err) {
    console.error("GET /admin/stats/by-tipster error:", err);
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
        tipster: { select: { pseudo: true, dayPassPrice: true, monthlyPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = "Date,Email,Expert,Type,Montant,Part Expert (70%),Part Plateforme (30%)";
    const rows = sales.map((s) => {
      const amount = s.type === "DAY_PASS" ? s.tipster.dayPassPrice : s.tipster.monthlyPrice;
      const tipsterShare = Math.round(amount * 0.7);
      const platformShare = amount - tipsterShare;
      const date = s.createdAt.toISOString().slice(0, 10);
      const amountStr = (amount / 100).toFixed(2).replace(".", ",");
      const tipsterShareStr = (tipsterShare / 100).toFixed(2).replace(".", ",");
      const platformShareStr = (platformShare / 100).toFixed(2).replace(".", ",");
      return `${date},${s.user.email},${s.tipster.pseudo},${s.type},${amountStr}€,${tipsterShareStr}€,${platformShareStr}€`;
    });

    const csv = [header, ...rows].join("\n");
    const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="ventes-${month}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("GET /admin/stats/export.csv error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /admin/send-daily-emails — Manually trigger J+1 emails
router.post("/send-daily-emails", async (_req, res) => {
  try {
    await sendDailyWinningEmails();
    res.json({ message: "Emails J+1 envoyés avec succès" });
  } catch (err) {
    console.error("Manual J+1 email trigger failed:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi des emails" });
  }
});

export default router;
