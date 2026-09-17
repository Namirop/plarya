import { Router } from "express";

import { handleError } from "../lib/http-errors";
import {
  authMiddleware,
  optionalAuthMiddleware,
  type AuthenticatedRequest,
} from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBecomeExpertSession, createCheckoutSession } from "../services/checkout-service";
import { becomeExpertSchema, createCheckoutSchema } from "../validators/checkout";

// Routes /checkout ; logique métier dans services/checkout-service.ts.

const router = Router();

// POST /checkout/create-session : pass jour ou abonnement mensuel, pour un
// utilisateur connecté ou un acheteur anonyme (caller null).
router.post(
  "/create-session",
  optionalAuthMiddleware,
  validate(createCheckoutSchema),
  async (req, res) => {
    const caller = req.user ? { userId: req.user.userId } : null;
    try {
      const result = await createCheckoutSession(req.body, caller);
      res.json(result);
    } catch (err) {
      handleError(
        err,
        res,
        "POST /checkout/create-session",
        "Erreur lors de la création du paiement",
      );
    }
  },
);

// POST /checkout/become-expert : abonnement Stripe ouvrant le statut expert.
router.post("/become-expert", authMiddleware, validate(becomeExpertSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const result = await createBecomeExpertSession(authReq.user.userId, req.body);
    res.json(result);
  } catch (err) {
    handleError(err, res, "POST /checkout/become-expert", "Erreur lors de la création du paiement");
  }
});

export default router;
