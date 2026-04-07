import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Validation échouée",
          details: err.issues.map((e) => ({
            field: (e.path as (string | number)[]).map(String).join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
