import { Request, Response, NextFunction } from "express";

export function tipsterMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "TIPSTER" && req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux tipsters" });
    return;
  }
  next();
}
