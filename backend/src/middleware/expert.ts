import type { Request, Response, NextFunction } from "express";

/**
 * Middleware expertMiddleware — réserve l'accès aux callers EXPERT.
 * Un ADMIN passe aussi (utile pour consulter une route /experts/me en
 * debug / support sans bascule de compte).
 *
 * À utiliser DERRIÈRE authMiddleware (qui pose req.user). Sans
 * authMiddleware en amont, req.user est undefined et toute requête
 * sera rejetée 403 (defensive, mais perd l'info "401 vs 403").
 */
export function expertMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "EXPERT" && req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux experts" });
    return;
  }
  next();
}
