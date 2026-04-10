import { Request, Response, NextFunction } from "express";
import { verifySession } from "../lib/magic-link";

export interface SessionUser {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session_token;
  if (!token) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  verifySession(token)
    .then((sessionUser) => {
      if (!sessionUser) {
        res.status(401).json({ error: "Session invalide ou expirée" });
        return;
      }
      req.user = sessionUser;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Erreur d'authentification" });
    });
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.session_token;
  if (!token) {
    next();
    return;
  }

  verifySession(token)
    .then((sessionUser) => {
      if (sessionUser) {
        req.user = sessionUser;
      }
      next();
    })
    .catch(() => {
      next();
    });
}
