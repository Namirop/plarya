import type { Request, Response, NextFunction } from "express";

import type { UserRole } from "../generated/prisma/enums";
import { logger } from "../lib/logger";
import { verifySession } from "../lib/magic-link";

/**
 * Identité de session attachée à req.user après authMiddleware.
 *
 * `role: UserRole` (enum Prisma) plutôt que `string` : permet au
 * compilateur de vérifier les comparaisons (`role === "EXPERT"`
 * autocomplete les valeurs valides et rejette `role === "expert"`).
 */
export interface SessionUser {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    // Augmentation Request.user — typage optional (`?`) car middlewares
    // qui ne sont pas authMiddleware (CORS, body-parser, etc.) reçoivent
    // un req.user undefined. Voir AuthenticatedRequest pour le narrow
    // post-authMiddleware.
    interface Request {
      user?: SessionUser;
    }
  }
}

/**
 * Type narrowing après authMiddleware : à utiliser dans les handlers
 * placés derrière `authMiddleware` pour éviter les `req.user!` répétés.
 *
 * Usage :
 *   router.post("/", authMiddleware, async (req, res) => {
 *     const authReq = req as AuthenticatedRequest;
 *     const userId = authReq.user.userId; // pas de !, type checked
 *   });
 *
 * Le cast est sémantiquement honnête : "ce middleware a garanti que
 * user est défini, je communique l'info au compilateur." Une seule
 * ligne au lieu de 5+ `!` dispersés.
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
 * Variante non-bloquante : si un session token est présent et valide,
 * attache req.user. Sinon next() sans erreur. À utiliser sur les routes
 * publiques qui veulent juste savoir SI l'user est connecté pour
 * adapter la réponse (ex: POST /checkout/create-session accepte un
 * acheteur anonyme ET un user loggé).
 *
 * Un échec de verifySession (DB down, etc.) ne doit PAS bloquer la
 * requête — on log puis on continue en non-authentifié. Pour les routes
 * vraiment sécurisées, utiliser authMiddleware qui renvoie 401.
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
