import { Router } from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { createCheckoutSchema, becomeExpertSchema } from "../validators/checkout";

const router = Router();

/**
 * Récupère le Stripe Customer ID d'un User, ou en crée un si absent.
 * Persiste l'ID en DB (User.stripeCustomerId) pour réutilisation lors
 * des achats suivants — évite les doublons de Customer côté Stripe.
 *
 * Race condition possible (deux checkouts simultanés du même user) :
 * créerait 2 Customers Stripe mais 1 seul gagne le UPDATE en DB.
 * Acceptable en MVP (orphelin Stripe au pire). À renforcer en V2
 * via row lock ou pattern advisory lock Postgres si nécessaire.
 */
async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  logger.info({ userId, stripeCustomerId: customer.id }, "Stripe customer created");
  return customer.id;
}

// POST /checkout/create-session
router.post("/create-session", optionalAuthMiddleware, async (req, res) => {
  try {
    const parsed = createCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const { expertId, type, email: bodyEmail } = parsed.data;

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
          expertId,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
      });

      if (existing) {
        res.status(400).json({ error: "Vous avez déjà un accès actif pour cet expert" });
        return;
      }
    }

    const expert = await prisma.expert.findUnique({ where: { id: expertId } });
    // 404 si l'expert n'existe pas OU s'il est soft-deleted : pas
    // question de prélever de l'argent pour un profile qui a
    // disparu publiquement (l'user serait débité sans pouvoir
    // accéder aux analyses — GET /experts/:id renvoie 404).
    if (!expert || expert.deletedAt) {
      res.status(404).json({ error: "Expert introuvable" });
      return;
    }
    // 400 si l'expert est en suppression programmée. Les subs
    // existantes continuent à fonctionner jusqu'à expiresAt mais on
    // refuse toute NOUVELLE sub — sinon le buyer paierait pour un
    // profile qui va disparaître automatiquement sous peu.
    if (expert.pendingDeletionAt) {
      res.status(400).json({
        error: "Cet expert ne prend plus de nouveaux abonnés. Choisis un autre expert.",
      });
      return;
    }

    // For day pass: check that at least one analysis hasn't started yet
    if (type === "DAY_PASS") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingCount = await prisma.prono.count({
        where: {
          expertId,
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
    const amount = isSubscription ? expert.monthlyPrice : expert.dayPassPrice;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Build metadata
    const metadata: Record<string, string> = { expertId, type };
    if (userId) {
      metadata.userId = userId;
    }
    if (customerEmail) {
      metadata.email = customerEmail;
    }

    // Si on a un User en DB, on peut lui attacher un Stripe Customer
    // (créé ou réutilisé). Sinon (acheteur anonyme dont le User sera
    // créé au webhook), on passe juste customer_email — le Stripe
    // Customer sera créé par Stripe et persisté au webhook (cf.
    // webhooks.ts handleCheckoutSessionCompleted).
    let stripeCustomerId: string | undefined;
    if (userId && customerEmail) {
      stripeCustomerId = await getOrCreateStripeCustomer(userId, customerEmail);
    }

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      // payment_method_types retiré : Stripe Checkout détecte
      // automatiquement les méthodes activées sur le compte (card,
      // Apple Pay sur iPhone Safari, Google Pay sur Android Chrome).
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail }),
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: isSubscription
                ? `Abonnement mensuel — ${expert.pseudo}`
                : `Day Pass — ${expert.pseudo}`,
            },
            ...(isSubscription ? { recurring: { interval: "month" as const } } : {}),
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${frontendUrl}/experts/${expertId}?checkout=success&stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/experts/${expertId}?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Checkout session create failed");
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

// POST /checkout/become-expert
router.post("/become-expert", authMiddleware, async (req, res) => {
  try {
    const parsed = becomeExpertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }

    const { pseudo, bio, sports } = parsed.data;
    const userId = req.user!.userId;

    // Check user is not already an expert
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { expert: true },
    });

    if (user?.role === "EXPERT" || user?.expert) {
      res.status(400).json({ error: "Vous êtes déjà expert" });
      return;
    }

    if (!user?.email) {
      res.status(404).json({ error: "Utilisateur introuvable" });
      return;
    }

    // Check pseudo uniqueness
    const existingPseudo = await prisma.expert.findUnique({ where: { pseudo } });
    if (existingPseudo) {
      res.status(400).json({ error: "Ce pseudo est déjà pris" });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const stripeCustomerId = await getOrCreateStripeCustomer(userId, user.email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // payment_method_types retiré : auto-detection card / Apple Pay
      // / Google Pay côté Stripe.
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 3900, // 39€
            product_data: {
              name: "Abonnement Expert — 39€/trimestre",
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
        purpose: "become_expert",
      },
      success_url: `${frontendUrl}/devenir-expert?checkout=success`,
      cancel_url: `${frontendUrl}/devenir-expert?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err }, "Become expert checkout session create failed");
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

export default router;
