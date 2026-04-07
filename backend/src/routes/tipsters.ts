import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calcWinRate, calcStreak, streakBadge } from "../lib/stats";
import { authMiddleware } from "../middleware/auth";
import { tipsterMiddleware } from "../middleware/tipster";

const router = Router();

// GET /tipsters/me — Tipster's own profile + stats (must be before /:id)
router.get("/me", authMiddleware, tipsterMiddleware, async (req, res) => {
  try {
    const tipster = await prisma.tipster.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!tipster) {
      res.status(404).json({ error: "Profil tipster introuvable" });
      return;
    }

    const winRate = await calcWinRate(tipster.id);
    const streak = await calcStreak(tipster.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { tipsterId: tipster.id, createdAt: { gte: today } },
    });

    res.json({
      id: tipster.id,
      pseudo: tipster.pseudo,
      bio: tipster.bio,
      photoUrl: tipster.photoUrl,
      sports: tipster.sports,
      dayPassPrice: tipster.dayPassPrice,
      monthlyPrice: tipster.monthlyPrice,
      warningMessage: tipster.warningMessage,
      winRate,
      streak,
      streakBadge: streakBadge(streak),
      pronosToday,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /tipsters — Tipsters sorted by win rate. ?all=true for classement (no limit).
router.get("/", async (req, res) => {
  try {
    const tipsters = await prisma.tipster.findMany({
      include: {
        _count: { select: { pronos: true } },
        user: { select: { email: true } },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = await Promise.all(
      tipsters.map(async (t) => {
        const winRate = await calcWinRate(t.id);
        const streak = await calcStreak(t.id);

        const pronosToday = await prisma.prono.count({
          where: { tipsterId: t.id, createdAt: { gte: today } },
        });

        // Get today's pronos for teasing (without pick/argument)
        const todayPronos = await prisma.prono.findMany({
          where: { tipsterId: t.id, createdAt: { gte: today } },
          select: {
            id: true,
            matchName: true,
            league: true,
            odds: true,
            teasing: true,
            result: true,
            matchDate: true,
            createdAt: true,
          },
        });

        return {
          id: t.id,
          pseudo: t.pseudo,
          bio: t.bio,
          photoUrl: t.photoUrl,
          sports: t.sports,
          dayPassPrice: t.dayPassPrice,
          monthlyPrice: t.monthlyPrice,
          warningMessage: t.warningMessage,
          winRate,
          streak,
          streakBadge: streakBadge(streak),
          pronosToday,
          todayPronos,
        };
      })
    );

    // Sort by win rate desc
    enriched.sort((a, b) => b.winRate - a.winRate);
    const all = req.query.all === "true";
    res.json(all ? enriched : enriched.slice(0, 6));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /tipsters/:id — Tipster profile with blurred pronos
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const tipster = await prisma.tipster.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!tipster) {
      res.status(404).json({ error: "Tipster introuvable" });
      return;
    }

    const winRate = await calcWinRate(tipster.id);
    const streak = await calcStreak(tipster.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { tipsterId: tipster.id, createdAt: { gte: today } },
    });

    // Past pronos: show pick (public track record). Pending: hide pick (blurred).
    const rawPronos = await prisma.prono.findMany({
      where: { tipsterId: tipster.id },
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
        matchDate: true,
        createdAt: true,
      },
    });

    // Strip pick from PENDING pronos
    const pronos = rawPronos.map((p) => ({
      ...p,
      pick: p.result === "PENDING" ? null : p.pick,
    }));

    res.json({
      id: tipster.id,
      pseudo: tipster.pseudo,
      bio: tipster.bio,
      photoUrl: tipster.photoUrl,
      sports: tipster.sports,
      dayPassPrice: tipster.dayPassPrice,
      monthlyPrice: tipster.monthlyPrice,
      warningMessage: tipster.warningMessage,
      winRate,
      streak,
      streakBadge: streakBadge(streak),
      pronosToday,
      pronos,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /tipsters/:id/pronos — Full pronos (requires active subscription)
router.get("/:id/pronos", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const tipsterId = req.params.id as string;

    // Check if user has active subscription to this tipster
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        tipsterId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    // Allow tipster to see their own pronos, or admin
    const tipster = await prisma.tipster.findUnique({
      where: { id: tipsterId },
      select: { userId: true },
    });

    const isOwner = tipster?.userId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!subscription && !isOwner && !isAdmin) {
      res.status(403).json({ error: "Abonnement requis pour voir les pronos" });
      return;
    }

    const pronos = await prisma.prono.findMany({
      where: { tipsterId },
      orderBy: { createdAt: "desc" },
    });

    res.json(pronos);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
