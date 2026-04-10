import { Router } from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { createCheckoutSchema, becomeTipsterSchema } from "../validators/checkout";

const router = Router();

// POST /checkout/create-session
router.post("/create-session", optionalAuthMiddleware, async (req, res) => {
  try {
    const parsed = createCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const { tipsterId, type, email: bodyEmail } = parsed.data;

    // Resolve userId and email
    let userId: string | undefined;
    let customerEmail: string | undefined;

    if (req.user) {
      // Authenticated user
      userId = req.user.userId;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      customerEmail = dbUser?.email;
    } else if (bodyEmail) {
      // Non-authenticated: email provided in body
      customerEmail = bodyEmail.toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: customerEmail },
      });
      if (existingUser) {
        userId = existingUser.id;
      }
    } else {
      res.status(401).json({ error: "Email requis" });
      return;
    }

    // Check existing active subscription if we have a userId
    if (userId) {
      const existing = await prisma.subscription.findFirst({
        where: {
          userId,
          tipsterId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      });

      if (existing) {
        res.status(400).json({ error: "Vous avez déjà un accès actif pour cet expert" });
        return;
      }
    }

    const tipster = await prisma.tipster.findUnique({ where: { id: tipsterId } });
    if (!tipster) {
      res.status(404).json({ error: "Tipster introuvable" });
      return;
    }

    // For day pass: check that at least one analysis hasn't started yet
    if (type === "DAY_PASS") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingCount = await prisma.prono.count({
        where: {
          tipsterId,
          createdAt: { gte: today },
          startTime: { gt: new Date() },
        },
      });

      if (upcomingCount === 0) {
        res.status(400).json({
          error: "Les analyses de cet expert sont déjà terminées pour aujourd'hui.",
        });
        return;
      }
    }

    const isSubscription = type === "MONTHLY";
    const amount = isSubscription ? tipster.monthlyPrice : tipster.dayPassPrice;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Build metadata
    const metadata: Record<string, string> = { tipsterId, type };
    if (userId) {
      metadata.userId = userId;
    }
    if (customerEmail) {
      metadata.email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
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
      metadata,
      success_url: `${frontendUrl}/tipsters/${tipsterId}?checkout=success&stripe_session_id={CHECKOUT_SESSION_ID}`,
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
