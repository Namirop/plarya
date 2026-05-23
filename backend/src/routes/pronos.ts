import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { expertMiddleware } from "../middleware/expert";
import { validate } from "../middleware/validate";
import { createPronoSchema, updateResultSchema } from "../validators/prono";

const router = Router();

// Reusable include for bookmaker odds
const bookmakerOddsInclude = {
  bookmakerOdds: {
    include: {
      bookmaker: {
        include: { affiliateLinks: true },
      },
    },
  },
} as const;

// POST /pronos — Expert publishes a prono
router.post(
  "/",
  authMiddleware,
  expertMiddleware,
  validate(createPronoSchema),
  async (req, res) => {
    try {
      const expert = await prisma.expert.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });

      if (!expert) {
        res.status(404).json({ error: "Profil expert introuvable" });
        return;
      }

      const { bookmakerOdds, ...pronoData } = req.body;

      // Auto-deflag previous featured prono for this expert today
      if (pronoData.isFeatured) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        await prisma.prono.updateMany({
          where: {
            expertId: expert.id,
            isFeatured: true,
            createdAt: { gte: todayStart },
          },
          data: { isFeatured: false },
        });
      }

      const prono = await prisma.prono.create({
        data: {
          expertId: expert.id,
          matchName: pronoData.matchName,
          league: pronoData.league,
          pick: pronoData.pick,
          odds: pronoData.odds,
          teasing: pronoData.teasing,
          argument: pronoData.argument,
          startTime: new Date(pronoData.startTime),
          isFeatured: pronoData.isFeatured ?? false,
          matchDate: pronoData.matchDate ? new Date(pronoData.matchDate) : undefined,
          ...(bookmakerOdds && bookmakerOdds.length > 0
            ? {
                bookmakerOdds: {
                  create: bookmakerOdds.map((bo: { bookmakerId: string; odds: number }) => ({
                    bookmakerId: bo.bookmakerId,
                    odds: bo.odds,
                  })),
                },
              }
            : {}),
        },
        include: bookmakerOddsInclude,
      });

      res.status(201).json(prono);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// GET /pronos/mine — Expert's own pronos (must be before /:id)
router.get("/mine", authMiddleware, expertMiddleware, async (req, res) => {
  try {
    const expert = await prisma.expert.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });

    if (!expert) {
      res.status(404).json({ error: "Profil expert introuvable" });
      return;
    }

    const pronos = await prisma.prono.findMany({
      where: { expertId: expert.id },
      orderBy: { createdAt: "desc" },
      include: bookmakerOddsInclude,
    });

    res.json(pronos);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /pronos/:id/result — Expert validates won/lost
router.patch(
  "/:id/result",
  authMiddleware,
  expertMiddleware,
  validate(updateResultSchema),
  async (req, res) => {
    try {
      const id = req.params.id as string;
      const prono = await prisma.prono.findUnique({
        where: { id },
        include: { expert: { select: { userId: true } } },
      });

      if (!prono) {
        res.status(404).json({ error: "Prono introuvable" });
        return;
      }

      // Only the prono's expert or admin can update
      if (prono.expert.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
        res.status(403).json({ error: "Non autorisé" });
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
  },
);

// GET /pronos/:id — Single prono detail (checks subscription)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const prono = await prisma.prono.findUnique({
      where: { id },
      include: {
        expert: { select: { userId: true, pseudo: true } },
        ...bookmakerOddsInclude,
      },
    });

    if (!prono) {
      res.status(404).json({ error: "Prono introuvable" });
      return;
    }

    const userId = req.user!.userId;
    const isOwner = prono.expert.userId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      // Check subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          expertId: prono.expertId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      });

      if (!subscription) {
        res.status(403).json({ error: "Abonnement requis" });
        return;
      }
    }

    res.json(prono);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
