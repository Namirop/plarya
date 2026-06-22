import { Router } from "express";

import { handleError } from "../lib/http-errors";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { expertMiddleware } from "../middleware/expert";
import { validate } from "../middleware/validate";
import { validateParams } from "../middleware/validate-params";
import {
  getExpertByUserIdOrThrow,
  getPronoDetailForUser,
  listPronosByExpertId,
  publishProno,
  updatePronoResult,
} from "../services/prono-service";
import { createPronoSchema, pronoIdParamsSchema, updateResultSchema } from "../validators/prono";

/**
 * Routes /pronos — orchestration HTTP uniquement.
 *
 * Convention :
 *  - Extraction des inputs depuis req
 *  - Appel d'un service (cf. services/prono-service.ts)
 *  - Sérialisation HTTP (status + json)
 *  - Gestion d'erreur centralisée via handleError() (mapping
 *    ServiceError → status code, fallback 500 + log structuré)
 *
 * Le pattern routes minces permet de tester la logique métier
 * sans monter Express (cf. web-patterns.md §"Service layer").
 */

const router = Router();

// POST /pronos — Expert publishes a prono
router.post(
  "/",
  authMiddleware,
  expertMiddleware,
  validate(createPronoSchema),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const expert = await getExpertByUserIdOrThrow(authReq.user.userId);
      const prono = await publishProno(expert.id, req.body);
      res.status(201).json(prono);
    } catch (err) {
      handleError(err, res, "POST /pronos");
    }
  },
);

// GET /pronos/mine — Expert's own pronos (must be before /:id)
router.get("/mine", authMiddleware, expertMiddleware, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const expert = await getExpertByUserIdOrThrow(authReq.user.userId);
    const pronos = await listPronosByExpertId(expert.id);
    res.json(pronos);
  } catch (err) {
    handleError(err, res, "GET /pronos/mine");
  }
});

// PATCH /pronos/:id/result — Expert (owner) or admin updates result
router.patch(
  "/:id/result",
  authMiddleware,
  expertMiddleware,
  validateParams(pronoIdParamsSchema),
  validate(updateResultSchema),
  async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const updated = await updatePronoResult(req.params.id, req.body, authReq.user);
      res.json(updated);
    } catch (err) {
      handleError(err, res, "PATCH /pronos/:id/result");
    }
  },
);

// GET /pronos/:id — Single prono detail (subscription-gated)
router.get("/:id", authMiddleware, validateParams(pronoIdParamsSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const prono = await getPronoDetailForUser(req.params.id, authReq.user);
    res.json(prono);
  } catch (err) {
    handleError(err, res, "GET /pronos/:id");
  }
});

export default router;
