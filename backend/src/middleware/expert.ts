import type { Request, Response, NextFunction } from "express";

/** Réserve la route aux rôles EXPERT et ADMIN. À placer après authMiddleware. */
export function expertMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "EXPERT" && req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux experts" });
    return;
  }
  next();
}
