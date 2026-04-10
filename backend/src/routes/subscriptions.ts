import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { checkSubscriptionSchema } from "../validators/checkout";

const router = Router();

// POST /subscriptions/check — Check if user has access to a tipster's pronos
router.post("/check", authMiddleware, validate(checkSubscriptionSchema), async (req, res) => {
  try {
    const { tipsterId } = req.body;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user!.userId,
        tipsterId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    res.json({ hasAccess: !!subscription, subscription });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /subscriptions/me — User's active subscriptions
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.userId },
      include: {
        tipster: {
          select: { id: true, pseudo: true, photoUrl: true, sports: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
