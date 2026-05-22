import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { calcWinRate } from "../lib/stats";
import { authMiddleware } from "../middleware/auth";
import { expertMiddleware } from "../middleware/expert";
import { updateExpertSchema } from "../validators/expert-self";

const router = Router();

// GET /experts/me — Expert's own profile + stats (must be before /:id)
router.get("/me", authMiddleware, expertMiddleware, async (req, res) => {
  try {
    const expert = await prisma.expert.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!expert) {
      res.status(404).json({ error: "Profil expert introuvable" });
      return;
    }

    const winRate = await calcWinRate(expert.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { expertId: expert.id, createdAt: { gte: today } },
    });

    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /experts/me — Update expert profile
router.patch("/me", authMiddleware, expertMiddleware, async (req, res) => {
  try {
    const parsed = updateExpertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const expert = await prisma.expert.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!expert) {
      res.status(404).json({ error: "Profil expert introuvable" });
      return;
    }

    const { pseudo, bio, dailyNote, sports } = parsed.data;

    // Check pseudo uniqueness if changed
    if (pseudo && pseudo !== expert.pseudo) {
      const existing = await prisma.expert.findUnique({ where: { pseudo } });
      if (existing) {
        res.status(400).json({ error: "Ce pseudo est déjà pris" });
        return;
      }
    }

    const updateData: Record<string, unknown> = {};
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

    res.json({
      id: updated.id,
      pseudo: updated.pseudo,
      bio: updated.bio,
      dailyNote: updated.dailyNote,
      dailyNoteDate: updated.dailyNoteDate,
      sports: updated.sports,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /experts — Experts sorted by displayOrder ASC, createdAt DESC.
router.get("/", async (req, res) => {
  try {
    const experts = await prisma.expert.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = await Promise.all(
      experts.map(async (e) => {
        const pronosToday = await prisma.prono.count({
          where: { expertId: e.id, createdAt: { gte: today } },
        });

        // Get today's pronos for teasing (without pick/argument)
        const todayPronos = await prisma.prono.findMany({
          where: { expertId: e.id, createdAt: { gte: today } },
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
        });

        return {
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
          pronosToday,
          todayPronos,
        };
      }),
    );

    const limit = req.query.all === "true" ? enriched.length : 6;
    res.json(enriched.slice(0, limit));
  } catch (err) {
    logger.error({ err, route: "GET /experts" }, "List experts failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /experts/:id — Expert profile with blurred pronos
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const expert = await prisma.expert.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!expert) {
      res.status(404).json({ error: "Expert introuvable" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { expertId: expert.id, createdAt: { gte: today } },
    });

    // Past pronos: show pick (public track record). Pending: hide pick (blurred).
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

    // Strip pick from PENDING pronos
    const pronos = rawPronos.map((p) => ({
      ...p,
      pick: p.result === "PENDING" ? null : p.pick,
    }));

    res.json({
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
      pronosToday,
      pronos,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /experts/:id/view — Increment view counter
router.post("/:id/view", async (req, res) => {
  try {
    await prisma.expert.update({
      where: { id: req.params.id as string },
      data: { viewsToday: { increment: 1 } },
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Expert introuvable" });
  }
});

// GET /experts/:id/pronos — Full pronos (requires active subscription)
router.get("/:id/pronos", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const expertId = req.params.id as string;

    // Check if user has active subscription to this expert
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        expertId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    // Allow expert to see their own pronos, or admin
    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
      select: { userId: true },
    });

    const isOwner = expert?.userId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!subscription && !isOwner && !isAdmin) {
      res.status(403).json({ error: "Abonnement requis pour voir les pronos" });
      return;
    }

    const pronos = await prisma.prono.findMany({
      where: { expertId },
      orderBy: { createdAt: "desc" },
      include: {
        bookmakerOdds: {
          include: {
            bookmaker: {
              include: { affiliateLinks: true },
            },
          },
        },
      },
    });

    res.json(pronos);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
