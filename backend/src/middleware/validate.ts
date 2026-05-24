import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

import { logger } from "../lib/logger";

/**
 * Middleware générique de validation du `req.body` avec un schéma Zod.
 *
 * Propage le type inféré au `req.body` côté handler — un handler typé
 * comme `(req: Request<unknown, unknown, CreatePronoInput>, …)` reçoit
 * directement la shape parsée, sans cast ni redéclaration inline.
 *
 * En pratique, la propagation de type s'obtient soit :
 *  - en typant explicitement le handler : `(req: Request<unknown, unknown, z.infer<typeof schema>>, res) => {}`
 *  - en accédant via `req.body as CreatePronoInput` (le narrow runtime
 *    est garanti par le schema.parse() ci-dessous, le cast TypeScript
 *    reste safe).
 *
 * Le param-type `T extends ZodSchema` est plus précis que `ZodSchema`
 * brut : on retient le schéma exact passé en argument, donc `z.infer<T>`
 * donne la shape concrète (pas `unknown`).
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
      // Autre erreur inattendue (rare — Zod throw uniquement ZodError).
      // On log et délègue au error handler Express global.
      logger.error({ err }, "validate() middleware: non-Zod error thrown");
      next(err);
    }
  };
}
