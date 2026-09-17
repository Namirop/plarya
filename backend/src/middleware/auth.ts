import type { Request, Response, NextFunction } from "express";

import type { UserRole } from "../generated/prisma/enums";
import { logger } from "../lib/logger";
import { verifySession } from "../lib/magic-link";

/** Identité attachée à `req.user` par authMiddleware. */
export interface SessionUser {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

/**
 * `req` derrière authMiddleware, où `user` est garanti :
 * `const authReq = req as AuthenticatedRequest`.
 */
export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.session_token;
  if (!token) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  try {
    const sessionUser = await verifySession(token);
    if (!sessionUser) {
      res.status(401).json({ error: "Session invalide ou expirée" });
      return;
    }
    req.user = sessionUser;
    next();
  } catch (err) {
    logger.error({ err }, "Auth middleware failed");
    res.status(401).json({ error: "Erreur d'authentification" });
  }
}

/**
 * Variante non bloquante pour les routes publiques qui adaptent leur réponse
 * à un utilisateur connecté (ex. POST /checkout/create-session). Toute erreur
 * de vérification laisse la requête continuer en anonyme.
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.session_token;
  if (!token) {
    next();
    return;
  }

  try {
    const sessionUser = await verifySession(token);
    if (sessionUser) {
      req.user = sessionUser;
    }
    next();
  } catch (err) {
    logger.warn({ err }, "Optional auth middleware: verifySession failed, continuing as anonymous");
    next();
  }
}
