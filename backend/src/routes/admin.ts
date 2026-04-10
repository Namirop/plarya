import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";
import { validate } from "../middleware/validate";
import { createTipsterSchema, warningSchema } from "../validators/tipster";
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
      orderBy: { createdAt: "desc" },
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
