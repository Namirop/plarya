import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema, type z } from "zod";

import { logger } from "../lib/logger";

/**
 * Middleware générique de validation des params de route (`req.params`).
 *
 * Express type `req.params` comme `ParamsDictionary` (record string→string)
 * par défaut, ce qui suffit à compiler mais ne reflète pas la SHAPE
 * attendue par le handler. On valide donc via Zod ET on propage le type :
 * `Request<z.infer<T>>` donne `req.params: { id: string }` au lieu du
 * record générique, et garantit que la string passée est un CUID valide
 * (filtre les IDs malformés avant d'atteindre Prisma).
 *
 * 400 Bad Request si la validation échoue, avec le même format de
 * `details` que `validate()` pour cohérence des réponses d'erreur.
 *
 * Pourquoi un middleware séparé de validate() :
 *  - validate() consomme req.body, validateParams() consomme req.params
 *  - les deux se composent dans la chaîne route :
 *      router.patch("/:id", validateParams(idSchema), validate(bodySchema), handler)
 *  - séparer permet d'omettre l'un sans l'autre (ex: GET /:id n'a pas
 *    de body à valider)
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request<z.infer<T>>, res: Response, next: NextFunction): void => {
    try {
      // On remplace req.params par la version parsée. Le cast est safe :
      // schema.parse() renvoie z.infer<T>, et req.params accepte tout
      // record string-key compatible (Express n'a pas de garde runtime).
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
