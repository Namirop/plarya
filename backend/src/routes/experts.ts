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
import { updateExpertSchema } from "../validators/expert-self";

/**
 * Routes /experts — orchestration HTTP uniquement.
 * Logique métier dans services/expert-service.ts. Erreurs métier
 * mappées via handleError() (cf. lib/http-errors.ts).
 */

const router = Router();

const CACHE_PUBLIC_60 = "public, max-age=60, s-maxage=120, stale-while-revalidate=600";

/**
 * Rate-limit pour POST /experts/:id/view — dédoublonnement compteur
 * de vues.
 *
 * Sans ce limiter, un attaquant peut spammer cet endpoint avec une
 * boucle (curl, F5 répété, bot) pour gonfler artificiellement le
 * `viewsToday` d'un expert et fausser la preuve sociale.
 *
 * Clé : IP + expertId. 1 incrément par couple par heure. Reset
 * viewsToday est de toute façon nocturne (cron midnight_reset).
 */
const viewIncrementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1,
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // ipKeyGenerator normalise l'IP IPv6 vers /64 (sinon un user IPv6
    // bouge dans son /64 et contourne le limiter). Sans ce helper,
    // express-rate-limit 8+ refuse de démarrer (ERR_ERL_KEY_GEN_IPV6).
    const ip = ipKeyGenerator(req.ip ?? "unknown");
    return `view:${ip}:${req.params.id}`;
  },
  // Handler custom : 200 (silently throttled) plutôt que 429 — un
  // utilisateur qui rafraîchit la page ne doit pas voir d'erreur.
  handler: (_req, res) => {
    res.json({ ok: true, throttled: true });
  },
});

// GET /experts/me — Profil + stats internes (must be before /:id)
router.get("/me", authMiddleware, expertMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const profile = await getOwnExpertProfile(authReq.user.userId);
    res.json(profile);
  } catch (err) {
    handleError(err, res, "GET /experts/me");
  }
});

// PATCH /experts/me — Update partiel du profil
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

// GET /experts — Liste publique homepage
router.get("/", async (req, res) => {
  try {
    const experts = await listPublicExperts({ all: req.query.all === "true" });
    res.set("Cache-Control", CACHE_PUBLIC_60);
    res.json(experts);
  } catch (err) {
    handleError(err, res, "GET /experts");
  }
});

// GET /experts/:id — Profile public avec pronos masqués
router.get("/:id", validateParams(expertIdParamsSchema), async (req, res) => {
  try {
    const profile = await getPublicExpertProfile(req.params.id);
    res.set("Cache-Control", CACHE_PUBLIC_60);
    res.json(profile);
  } catch (err) {
    handleError(err, res, "GET /experts/:id");
  }
});

// POST /experts/:id/view — Incrément compteur de vues (rate-limité)
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

// GET /experts/:id/pronos — Pronos complets gated par subscription
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
