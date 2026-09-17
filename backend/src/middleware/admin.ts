import type { Request, Response, NextFunction } from "express";

/** Réserve la route au rôle ADMIN. À placer après authMiddleware (sinon 403). */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux admins" });
    return;
  }
  next();
}
