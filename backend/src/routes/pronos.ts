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

// Routes /pronos ; logique métier dans services/prono-service.ts.

const router = Router();

// POST /pronos : publication par un expert.
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

// GET /pronos/mine : pronos de l'expert connecté (déclaré avant /:id).
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

// PATCH /pronos/:id/result : résultat saisi par l'auteur ou un admin.
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

// GET /pronos/:id : détail, réservé aux abonnés (ou auteur/admin).
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
