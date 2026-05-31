import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

import { csrfCookieOptions } from "./cookies";

/**
 * CSRF — double-submit cookie pattern.
 *
 * Pourquoi : le cookie session est httpOnly + SameSite=Lax, ce qui
 * bloque déjà la majorité des CSRF (cross-site POST). Mais (a) certains
 * navigateurs / versions ne respectent pas strictement Lax pour les
 * formulaires top-level, et (b) si on déploie un jour avec frontend et
 * backend sur des eTLD+1 différents, l'argument SameSite s'évapore.
 * Le token CSRF est une defense-in-depth indépendante du domaining.
 *
 * Pattern :
 *  1. À la 1re requête sans cookie `csrf_token`, le middleware
 *     `csrfTokenIssuer` génère un token random et le pose comme cookie
 *     NON-httpOnly (le frontend doit pouvoir le lire en JS).
 *  2. Côté frontend (cf. lib/api.ts), avant toute requête mutante
 *     (POST/PATCH/PUT/DELETE), on lit ce cookie et on l'envoie en
 *     header `X-CSRF-Token`.
 *  3. Le middleware `csrfValidator` rejette toute requête mutante où
 *     header ≠ cookie (ou l'un des deux est manquant).
 *
 * Sécurité : un attaquant cross-origin (evil.com) ne peut PAS lire le
 * cookie csrf_token (Same-Origin Policy bloque document.cookie sur un
 * domaine tiers), donc il ne peut pas mettre le bon header. Sa requête
 * mutante échoue avec 403.
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
    // Hydrate aussi req.cookies pour que csrfValidator voie le token
    // si jamais il est appliqué dans la même requête (cas d'un POST
    // qui serait le 1er hit — peu probable mais defensive).
    req.cookies[CSRF_COOKIE] = token;
  }
  next();
}

export function csrfValidator(req: Request, res: Response, next: NextFunction): void {
  // GET/HEAD/OPTIONS : safe methods, pas de CSRF possible (pas de
  // mutation côté serveur).
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
