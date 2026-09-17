import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

import { logger } from "../lib/logger";

/**
 * Valide et remplace `req.body` par la version parsée du schéma Zod ;
 * 400 avec la liste des champs en erreur sinon.
 */
export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request<unknown, unknown, z.infer<T>>, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Validation échouée",
          details: err.issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        });
        return;
      }
      logger.error({ err }, "validate() middleware: non-Zod error thrown");
      next(err);
    }
  };
}
