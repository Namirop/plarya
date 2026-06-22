import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

import { logger } from "../lib/logger";

/**
 * Middleware générique de validation des query strings (`req.query`).
 *
 * Mêmes principes que validateParams() mais pour `req.query`. Permet de
 * typer/valider les ?limit=&offset=&from=... dispersés dans les routes
 * admin (cf. /admin/pronos, /admin/stats/sales, /admin/stats/export.csv)
 * et de coercer les strings en number/Date via `z.coerce` côté schéma.
 *
 * ⚠️ Express 5 : `req.query` est devenu un getter SANS setter — un
 * simple `req.query = parsed` est silencieusement ignoré (le getter
 * continue de renvoyer la query string parsée d'origine). On réécrit
 * donc la propriété via `Object.defineProperty` pour exposer au handler
 * la version validée + coercée (sinon les number/Date repasseraient en
 * string et casseraient les services en aval).
 *
 * 400 Bad Request si la validation échoue, même format de `details`
 * que validate() / validateParams() pour cohérence des réponses.
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (
    req: Request<unknown, unknown, unknown, z.infer<T>>,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, "query", {
        value: parsed,
        writable: true,
        configurable: true,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Paramètres de requête invalides",
          details: err.issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        });
        return;
      }
      logger.error({ err }, "validateQuery() middleware: non-Zod error thrown");
      next(err);
    }
  };
}
