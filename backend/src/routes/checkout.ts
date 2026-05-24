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

/**
 * Routes /checkout — orchestration HTTP. La logique métier (résolution
 * userId/email, vérifs d'état expert, création session Stripe) vit
 * dans services/checkout-service.ts.
 */

const router = Router();

// POST /checkout/create-session — Day pass ou subscription mensuelle
router.post(
  "/create-session",
  optionalAuthMiddleware,
  validate(createCheckoutSchema),
  async (req, res) => {
    // optionalAuthMiddleware peut ou non poser req.user. On passe le
    // caller (ou null) au service qui gère les deux flows.
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

// POST /checkout/become-expert — Souscription 39€/trimestre pour devenir Expert
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
