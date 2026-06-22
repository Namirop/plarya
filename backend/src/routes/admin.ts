import { Router } from "express";
import type { Request, Response } from "express";

import { sendDailyWinningEmails } from "../lib/cron";
import { handleError } from "../lib/http-errors";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { validateParams } from "../middleware/validate-params";
import { validateQuery } from "../middleware/validate-query";
import {
  buildSalesCsv,
  createExpertAccount,
  getGlobalStats,
  getRevenueByDay,
  getRevenueByExpert,
  listAllExperts,
  listAllUsers,
  listPronosPaginated,
  listSalesPaginated,
  overridePronoResult,
  setExpertDisplayOrder,
  setExpertWarning,
} from "../services/admin-service";
import {
  paginationQuerySchema,
  salesExportQuerySchema,
  salesFilterQuerySchema,
  type PaginationQuery,
  type SalesExportQuery,
  type SalesFilterQuery,
} from "../validators/admin";
import {
  createExpertSchema,
  displayOrderSchema,
  expertIdParamsSchema,
  warningSchema,
} from "../validators/expert";
import { pronoIdParamsSchema, updateResultSchema } from "../validators/prono";

/**
 * Routes /admin — orchestration HTTP uniquement.
 *
 * Toutes les routes sont gatées par authMiddleware + adminMiddleware
 * appliqués au niveau du router (cf. `router.use` ci-dessous). Pas
 * besoin de les répéter sur chaque route.
 *
 * Logique métier : services/admin-service.ts.
 */

const router = Router();

router.use(authMiddleware, adminMiddleware);

// ── Experts ─────────────────────────────────────────────────────────

router.get("/experts", async (_req, res) => {
  try {
    res.json(await listAllExperts());
  } catch (err) {
    handleError(err, res, "GET /admin/experts");
  }
});

router.post("/experts", validate(createExpertSchema), async (req, res) => {
  try {
    const user = await createExpertAccount(req.body);
    res.status(201).json(user);
  } catch (err) {
    handleError(err, res, "POST /admin/experts");
  }
});

router.patch(
  "/experts/:id/warning",
  validateParams(expertIdParamsSchema),
  validate(warningSchema),
  async (req, res) => {
    try {
      res.json(await setExpertWarning(req.params.id, req.body));
    } catch (err) {
      handleError(err, res, "PATCH /admin/experts/:id/warning");
    }
  },
);

router.patch(
  "/experts/:id/display-order",
  validateParams(expertIdParamsSchema),
  validate(displayOrderSchema),
  async (req, res) => {
    try {
      res.json(await setExpertDisplayOrder(req.params.id, req.body));
    } catch (err) {
      handleError(err, res, "PATCH /admin/experts/:id/display-order");
    }
  },
);

// ── Users ───────────────────────────────────────────────────────────

router.get("/users", async (_req, res) => {
  try {
    res.json(await listAllUsers());
  } catch (err) {
    handleError(err, res, "GET /admin/users");
  }
});

// ── Pronos ──────────────────────────────────────────────────────────

router.get(
  "/pronos",
  validateQuery(paginationQuerySchema),
  async (req: Request<unknown, unknown, unknown, PaginationQuery>, res: Response) => {
    try {
      res.json(await listPronosPaginated(req.query));
    } catch (err) {
      handleError(err, res, "GET /admin/pronos");
    }
  },
);

router.patch(
  "/pronos/:id/result",
  validateParams(pronoIdParamsSchema),
  validate(updateResultSchema),
  async (req, res) => {
    try {
      res.json(await overridePronoResult(req.params.id, req.body));
    } catch (err) {
      handleError(err, res, "PATCH /admin/pronos/:id/result");
    }
  },
);

// ── Stats ───────────────────────────────────────────────────────────

router.get("/stats", async (_req, res) => {
  try {
    res.json(await getGlobalStats());
  } catch (err) {
    handleError(err, res, "GET /admin/stats");
  }
});

router.get("/stats/revenue", async (_req, res) => {
  try {
    res.json(await getRevenueByDay());
  } catch (err) {
    handleError(err, res, "GET /admin/stats/revenue");
  }
});

router.get(
  "/stats/sales",
  validateQuery(salesFilterQuerySchema),
  async (req: Request<unknown, unknown, unknown, SalesFilterQuery>, res: Response) => {
    try {
      res.json(await listSalesPaginated(req.query));
    } catch (err) {
      handleError(err, res, "GET /admin/stats/sales");
    }
  },
);

router.get("/stats/by-expert", async (_req, res) => {
  try {
    res.json(await getRevenueByExpert());
  } catch (err) {
    handleError(err, res, "GET /admin/stats/by-expert");
  }
});

router.get(
  "/stats/export.csv",
  validateQuery(salesExportQuerySchema),
  async (req: Request<unknown, unknown, unknown, SalesExportQuery>, res: Response) => {
    try {
      const { csv, month } = await buildSalesCsv(req.query);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="ventes-${month}.csv"`);
      res.send(csv);
    } catch (err) {
      handleError(err, res, "GET /admin/stats/export.csv");
    }
  },
);

// ── Actions ────────────────────────────────────────────────────────

router.post("/send-daily-emails", async (_req, res) => {
  try {
    await sendDailyWinningEmails();
    res.json({ message: "Emails J+1 envoyés avec succès" });
  } catch (err) {
    handleError(err, res, "POST /admin/send-daily-emails", "Erreur lors de l'envoi des emails");
  }
});

export default router;
