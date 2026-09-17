import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

import { csrfCookieOptions } from "./cookies";

/**
 * CSRF par double soumission : le token du cookie `csrf_token` doit être
 * renvoyé en header `X-CSRF-Token` sur toute requête mutante. Indispensable
 * avec `SameSite=None` ; un site tiers ne peut lire ni le cookie ni (CORS)
 * la réponse de `GET /auth/csrf`.
 */
const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

function generate(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function csrfTokenIssuer(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = generate();
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
    // Visible dès cette requête : `GET /auth/csrf` renvoie ainsi le token
    // qui vient d'être posé.
    req.cookies[CSRF_COOKIE] = token;
  }
  next();
}

export function csrfValidator(req: Request, res: Response, next: NextFunction): void {
  // Méthodes sans effet de bord : pas de vérification.
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerValue = req.headers[CSRF_HEADER];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: "Requête bloquée — token CSRF invalide" });
    return;
  }

  next();
}
