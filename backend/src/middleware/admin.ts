import type { Request, Response, NextFunction } from "express";

/**
 * Middleware adminMiddleware — bloque l'accès aux callers non-ADMIN.
 *
 * À utiliser DERRIÈRE authMiddleware (qui pose req.user). Sans
 * authMiddleware en amont, req.user est undefined et toute requête
 * sera rejetée 403 (defensive, mais perd l'info "401 vs 403").
 *
 * Conv : routes/admin.ts applique les deux en une fois via
 * `router.use(authMiddleware, adminMiddleware)`.
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux admins" });
    return;
  }
  next();
}
