import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

import { logger } from "../lib/logger";

/**
 * Équivalent de validate() pour `req.params` : rejette en 400 les
 * identifiants malformés avant toute requête Prisma et type les paramètres.
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request<z.infer<T>>, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Paramètres de route invalides",
          details: err.issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        });
        return;
      }
      logger.error({ err }, "validateParams() middleware: non-Zod error thrown");
      next(err);
    }
  };
}
