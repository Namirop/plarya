import { Router } from "express";
import rateLimit from "express-rate-limit";

import { handleError } from "../lib/http-errors";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { validateParams } from "../middleware/validate-params";
import {
  cancelOwnSubscription,
  hasActiveSubscription,
  isCheckoutSessionReady,
  listOwnSubscriptions,
} from "../services/subscription-service";
import { checkSubscriptionSchema } from "../validators/checkout";
import { subscriptionIdParamsSchema } from "../validators/subscription";

const router = Router();

// Le polling post-paiement appelle /check-stripe-session toutes les 2 s (15 fois
// par tentative) : 60/min par IP laisse de la marge sans permettre
// d'énumérer les sessions Stripe.
const sessionLookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Trop de requêtes, réessayez dans une minute" },
});

// POST /subscriptions/check : { hasAccess } seulement, sans détail de l'abonnement.
router.post("/check", authMiddleware, validate(checkSubscriptionSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const hasAccess = await hasActiveSubscription(authReq.user.userId, req.body.expertId);
    res.json({ hasAccess });
  } catch (err) {
    handleError(err, res, "POST /subscriptions/check");
  }
});

/**
 * GET /subscriptions/check-stripe-session?stripe_session_id=cs_…
 * Sans authentification, pour l'acheteur anonyme : `{ ready }` vaut true dès
 * que le webhook a créé l'abonnement. Rien d'autre n'est exposé ; une session
 * inconnue répond simplement `{ ready: false }`.
 */
router.get("/check-stripe-session", sessionLookupLimiter, async (req, res) => {
  try {
    const sessionId = req.query.stripe_session_id;
    if (typeof sessionId !== "string" || sessionId.length === 0) {
      res.status(400).json({ error: "stripe_session_id requis" });
      return;
    }
    const ready = await isCheckoutSessionReady(sessionId);
    res.json({ ready });
  } catch (err) {
    handleError(err, res, "GET /subscriptions/check-stripe-session");
  }
});

// GET /subscriptions/me : abonnements de l'utilisateur, tous statuts.
router.get("/me", authMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const subscriptions = await listOwnSubscriptions(authReq.user.userId);
    res.json(subscriptions);
  } catch (err) {
    handleError(err, res, "GET /subscriptions/me");
  }
});

// POST /subscriptions/:id/cancel : résiliation d'un abonnement mensuel en fin de période.
router.post(
  "/:id/cancel",
  authMiddleware,
  validateParams(subscriptionIdParamsSchema),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const result = await cancelOwnSubscription(authReq.user.userId, req.params.id as string);
      res.json(result);
    } catch (err) {
      handleError(err, res, "POST /subscriptions/:id/cancel");
    }
  },
);

export default router;
