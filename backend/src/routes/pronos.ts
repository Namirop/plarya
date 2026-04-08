import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { tipsterMiddleware } from "../middleware/tipster";
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

// POST /pronos — Tipster publishes a prono
router.post(
  "/",
  authMiddleware,
  tipsterMiddleware,
  validate(createPronoSchema),
  async (req, res) => {
    try {
      const tipster = await prisma.tipster.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });

      if (!tipster) {
        res.status(404).json({ error: "Profil tipster introuvable" });
        return;
      }

      const { bookmakerOdds, ...pronoData } = req.body;

      const prono = await prisma.prono.create({
        data: {
          tipsterId: tipster.id,
          matchName: pronoData.matchName,
          league: pronoData.league,
          pick: pronoData.pick,
          odds: pronoData.odds,
          teasing: pronoData.teasing,
          argument: pronoData.argument,
          matchDate: pronoData.matchDate ? new Date(pronoData.matchDate) : undefined,
          ...(bookmakerOdds && bookmakerOdds.length > 0
            ? {
                bookmakerOdds: {
                  create: bookmakerOdds.map(
                    (bo: { bookmakerId: string; odds: number }) => ({
                      bookmakerId: bo.bookmakerId,
                      odds: bo.odds,
                    })
                  ),
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
  }
);

// GET /pronos/mine — Tipster's own pronos (must be before /:id)
router.get("/mine", authMiddleware, tipsterMiddleware, async (req, res) => {
  try {
    const tipster = await prisma.tipster.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });

    if (!tipster) {
      res.status(404).json({ error: "Profil tipster introuvable" });
      return;
    }

    const pronos = await prisma.prono.findMany({
      where: { tipsterId: tipster.id },
      orderBy: { createdAt: "desc" },
      include: bookmakerOddsInclude,
    });

    res.json(pronos);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /pronos/:id/result — Tipster validates won/lost
router.patch(
  "/:id/result",
  authMiddleware,
  tipsterMiddleware,
  validate(updateResultSchema),
  async (req, res) => {
    try {
      const id = req.params.id as string;
      const prono = await prisma.prono.findUnique({
        where: { id },
        include: { tipster: { select: { userId: true } } },
      });

      if (!prono) {
        res.status(404).json({ error: "Prono introuvable" });
        return;
      }

      // Only the prono's tipster or admin can update
      if (prono.tipster.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
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
  }
);

// GET /pronos/:id — Single prono detail (checks subscription)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const prono = await prisma.prono.findUnique({
      where: { id },
      include: {
        tipster: { select: { userId: true, pseudo: true } },
        ...bookmakerOddsInclude,
      },
    });

    if (!prono) {
      res.status(404).json({ error: "Prono introuvable" });
      return;
    }

    const userId = req.user!.userId;
    const isOwner = prono.tipster.userId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      // Check subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          tipsterId: prono.tipsterId,
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
