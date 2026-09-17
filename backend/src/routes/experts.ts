import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { handleError } from "../lib/http-errors";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { expertMiddleware } from "../middleware/expert";
import { validate } from "../middleware/validate";
import { validateParams } from "../middleware/validate-params";
import {
  getExpertPronosForUser,
  getOwnExpertProfile,
  getPublicExpertProfile,
  incrementViewCounter,
  listPublicExperts,
  updateOwnExpertProfile,
} from "../services/expert-service";
import { expertIdParamsSchema } from "../validators/expert";
import { cancelOwnExpertSubscription } from "../services/subscription-service";
import { updateExpertSchema } from "../validators/expert-self";

// Routes /experts ; logique métier dans services/expert-service.ts.

const router = Router();

const CACHE_PUBLIC_60 = "public, max-age=60, s-maxage=120, stale-while-revalidate=600";

// Une vue comptée par couple (IP, expert) par heure : le compteur public ne
// peut pas être gonflé en boucle.
const viewIncrementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1,
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // ipKeyGenerator ramène une IPv6 à son /64 (sinon contournement facile) ;
    // express-rate-limit 8 l'exige pour une clé personnalisée.
    const ip = ipKeyGenerator(req.ip ?? "unknown");
    return `view:${ip}:${req.params.id}`;
  },
  // 200 plutôt que 429 : recharger la page ne doit pas produire d'erreur.
  handler: (_req, res) => {
    res.json({ ok: true, throttled: true });
  },
});

// GET /experts/me : profil et statistiques internes (déclaré avant /:id).
router.get("/me", authMiddleware, expertMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const profile = await getOwnExpertProfile(authReq.user.userId);
    res.json(profile);
  } catch (err) {
    handleError(err, res, "GET /experts/me");
  }
});

// PATCH /experts/me : mise à jour partielle du profil.
router.patch(
  "/me",
  authMiddleware,
  expertMiddleware,
  validate(updateExpertSchema),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const updated = await updateOwnExpertProfile(authReq.user.userId, req.body);
      res.json(updated);
    } catch (err) {
      handleError(err, res, "PATCH /experts/me");
    }
  },
);

// POST /experts/me/subscription/cancel : résiliation en fin de période.
router.post("/me/subscription/cancel", authMiddleware, expertMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const result = await cancelOwnExpertSubscription(authReq.user.userId);
    res.json(result);
  } catch (err) {
    handleError(err, res, "POST /experts/me/subscription/cancel");
  }
});

// GET /experts : liste publique (?all=true pour tous).
router.get("/", async (req, res) => {
  try {
    const experts = await listPublicExperts({ all: req.query.all === "true" });
    res.set("Cache-Control", CACHE_PUBLIC_60);
    res.json(experts);
  } catch (err) {
    handleError(err, res, "GET /experts");
  }
});

// GET /experts/:id : profil public, picks en attente masqués.
router.get("/:id", validateParams(expertIdParamsSchema), async (req, res) => {
  try {
    const profile = await getPublicExpertProfile(req.params.id);
    res.set("Cache-Control", CACHE_PUBLIC_60);
    res.json(profile);
  } catch (err) {
    handleError(err, res, "GET /experts/:id");
  }
});

// POST /experts/:id/view : compteur de vues.
router.post(
  "/:id/view",
  viewIncrementLimiter,
  validateParams(expertIdParamsSchema),
  async (req, res) => {
    try {
      await incrementViewCounter(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      handleError(err, res, "POST /experts/:id/view");
    }
  },
);

// GET /experts/:id/pronos : pronos complets, réservés aux abonnés.
router.get(
  "/:id/pronos",
  authMiddleware,
  validateParams(expertIdParamsSchema),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const pronos = await getExpertPronosForUser(req.params.id, authReq.user);
      res.json(pronos);
    } catch (err) {
      handleError(err, res, "GET /experts/:id/pronos");
    }
  },
);

export default router;
