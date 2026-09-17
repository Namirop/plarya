import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

import { logger } from "../lib/logger";

/**
 * Équivalent de validate() pour `req.query` (valeurs converties via `z.coerce`).
 *
 * Express 5 : `req.query` est un getter sans setter, une affectation directe
 * serait ignorée. `Object.defineProperty` expose la version parsée au handler.
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
