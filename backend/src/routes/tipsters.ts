import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calcWinRate } from "../lib/stats";
import { authMiddleware } from "../middleware/auth";
import { tipsterMiddleware } from "../middleware/tipster";
import { updateTipsterSchema } from "../validators/tipsters";

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pronosToday = await prisma.prono.count({
      where: { tipsterId: tipster.id, createdAt: { gte: today } },
    });

    res.json({
      id: tipster.id,
      pseudo: tipster.pseudo,
      bio: tipster.bio,
      dailyNote: tipster.dailyNote,
      dailyNoteDate: tipster.dailyNoteDate,
      photoUrl: tipster.photoUrl,
      sports: tipster.sports,
      dayPassPrice: tipster.dayPassPrice,
      monthlyPrice: tipster.monthlyPrice,
      warningMessage: tipster.warningMessage,
      winRate,
      pronosToday,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /tipsters/me — Update tipster profile
router.patch("/me", authMiddleware, tipsterMiddleware, async (req, res) => {
  try {
    const parsed = updateTipsterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const tipster = await prisma.tipster.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!tipster) {
      res.status(404).json({ error: "Profil tipster introuvable" });
      return;
    }

    const { pseudo, bio, dailyNote, sports } = parsed.data;

    // Check pseudo uniqueness if changed
    if (pseudo && pseudo !== tipster.pseudo) {
      const existing = await prisma.tipster.findUnique({ where: { pseudo } });
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

    const updated = await prisma.tipster.update({
      where: { id: tipster.id },
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

// GET /tipsters — Experts sorted by displayOrder ASC, createdAt DESC.
router.get("/", async (req, res) => {
  try {
    const tipsters = await prisma.tipster.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = await Promise.all(
      tipsters.map(async (t) => {
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
            startTime: true,
            isFeatured: true,
            matchDate: true,
            createdAt: true,
          },
        });

        return {
          id: t.id,
          pseudo: t.pseudo,
          bio: t.bio,
          dailyNote: t.dailyNote,
          photoUrl: t.photoUrl,
          sports: t.sports,
          dayPassPrice: t.dayPassPrice,
          monthlyPrice: t.monthlyPrice,
          warningMessage: t.warningMessage,
          viewsToday: t.viewsToday,
          pronosToday,
          todayPronos,
        };
      }),
    );

    const limit = req.query.all === "true" ? enriched.length : 6;
    res.json(enriched.slice(0, limit));
  } catch (err) {
    console.error("GET /tipsters error:", err);
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
      id: tipster.id,
      pseudo: tipster.pseudo,
      bio: tipster.bio,
      dailyNote: tipster.dailyNote,
      photoUrl: tipster.photoUrl,
      sports: tipster.sports,
      dayPassPrice: tipster.dayPassPrice,
      monthlyPrice: tipster.monthlyPrice,
      warningMessage: tipster.warningMessage,
      viewsToday: tipster.viewsToday,
      pronosToday,
      pronos,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /tipsters/:id/view — Increment view counter
router.post("/:id/view", async (req, res) => {
  try {
    await prisma.tipster.update({
      where: { id: req.params.id as string },
      data: { viewsToday: { increment: 1 } },
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Tipster introuvable" });
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
