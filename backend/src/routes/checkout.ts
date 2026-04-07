import { Router } from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { createCheckoutSchema, becomeTipsterSchema } from "../validators/checkout";

const router = Router();

// POST /checkout/create-session
router.post("/create-session", authMiddleware, async (req, res) => {
  try {
    const parsed = createCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const { tipsterId, type } = parsed.data;
    const userId = req.user!.userId;

    // Check existing active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        tipsterId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      res.status(400).json({ error: "Vous avez déjà un accès actif pour ce tipster" });
      return;
    }

    const tipster = await prisma.tipster.findUnique({ where: { id: tipsterId } });
    if (!tipster) {
      res.status(404).json({ error: "Tipster introuvable" });
      return;
    }

    const isSubscription = type === "MONTHLY";
    const amount = isSubscription ? tipster.monthlyPrice : tipster.dayPassPrice;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: isSubscription
                ? `Abonnement mensuel — ${tipster.pseudo}`
                : `Day Pass — ${tipster.pseudo}`,
            },
            ...(isSubscription ? { recurring: { interval: "month" as const } } : {}),
          },
          quantity: 1,
        },
      ],
      metadata: { userId, tipsterId, type },
      success_url: `${frontendUrl}/tipsters/${tipsterId}?checkout=success`,
      cancel_url: `${frontendUrl}/tipsters/${tipsterId}?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

// POST /checkout/become-tipster
router.post("/become-tipster", authMiddleware, async (req, res) => {
  try {
    const parsed = becomeTipsterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const { pseudo, bio, sports } = parsed.data;
    const userId = req.user!.userId;

    // Check user is not already a tipster
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tipster: true },
    });

    if (user?.role === "TIPSTER" || user?.tipster) {
      res.status(400).json({ error: "Vous êtes déjà tipster" });
      return;
    }

    // Check pseudo uniqueness
    const existingPseudo = await prisma.tipster.findUnique({ where: { pseudo } });
    if (existingPseudo) {
      res.status(400).json({ error: "Ce pseudo est déjà pris" });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 3900, // 39€
            product_data: {
              name: "Abonnement Tipster — 39€/trimestre",
            },
            recurring: { interval: "month" as const, interval_count: 3 },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        pseudo,
        bio: bio || "",
        sports: JSON.stringify(sports),
        purpose: "become_tipster",
      },
      success_url: `${frontendUrl}/devenir-tipster?checkout=success`,
      cancel_url: `${frontendUrl}/devenir-tipster?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Become tipster checkout error:", err);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

export default router;
