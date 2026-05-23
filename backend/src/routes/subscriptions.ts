import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { checkSubscriptionSchema } from "../validators/checkout";

const router = Router();

// Rate-limit pour /check-stripe-session : 60 hits / min / IP. La modal
// "Paiement non confirmé" peut poll ce endpoint jusqu'à 10 fois en
// quelques secondes (5 initiaux + bouton Réessayer 3-5 fois). 60/min
// laisse de la marge sans permettre l'énumération massive de sessions
// Stripe.
const sessionLookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

// POST /subscriptions/check — Check if user has access to an expert's pronos
router.post("/check", authMiddleware, validate(checkSubscriptionSchema), async (req, res) => {
  try {
    const { expertId } = req.body;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user!.userId,
        expertId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
    });

    res.json({ hasAccess: !!subscription, subscription });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /subscriptions/check-stripe-session?stripe_session_id=cs_xxx
 *
 * Endpoint NON-authentifié pour permettre au frontend de poll
 * l'avancement post-checkout quand l'user n'est pas (encore) loggé
 * (flow anonyme + email-gate). Renvoie simplement `{ ready: boolean }`
 * sans aucune donnée sensible :
 *  - true  : une Subscription a bien été créée pour ce sessionId
 *            (webhook Stripe checkout.session.completed traité).
 *  - false : pas encore (ou jamais — si le paiement a échoué côté
 *            Stripe, ou si l'env CLI `stripe listen` n'est pas lancé
 *            en dev).
 *
 * Anti-énumération : on n'expose ni l'expertId, ni l'email, ni le
 * statut. Un attaquant qui guess un sessionId au hasard ne récupère
 * que `{ ready: false }` — équivalent à un sessionId inexistant.
 */
router.get("/check-stripe-session", sessionLookupLimiter, async (req, res) => {
  try {
    const sessionId = req.query.stripe_session_id;
    if (typeof sessionId !== "string" || sessionId.length === 0) {
      res.status(400).json({ error: "stripe_session_id requis" });
      return;
    }

    const sub = await prisma.subscription.findFirst({
      where: { stripeSessionId: sessionId },
      select: { id: true },
    });

    res.json({ ready: !!sub });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /subscriptions/me — User's active subscriptions
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.userId },
      include: {
        expert: {
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
