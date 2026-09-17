import type { CookieOptions } from "express";

/**
 * `COOKIE_SAMESITE` : `lax` si front et API partagent le même site, `none` sinon
 * (le cookie ne serait jamais renvoyé). `COOKIE_DOMAIN` (ex. `.example.com`,
 * API en sous-domaine) rend la session visible du serveur Next pour le rendu
 * serveur des pages connectées ; vide = cookie host-only.
 */

const IS_PROD = process.env.NODE_ENV === "production";

const SAME_SITE = ((process.env.COOKIE_SAMESITE || "lax").toLowerCase() as
  | "lax"
  | "none"
  | "strict");

// Les navigateurs rejettent un cookie `SameSite=None` sans `Secure`.
const SECURE = IS_PROD || SAME_SITE === "none";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: SECURE,
    sameSite: SAME_SITE,
    domain: COOKIE_DOMAIN,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  };
}

/** Cookie CSRF non httpOnly : le frontend doit pouvoir le lire. */
export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: SECURE,
    sameSite: SAME_SITE,
    domain: COOKIE_DOMAIN,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  };
}

/** Le navigateur n'efface le cookie que si ces attributs sont ceux de la pose. */
export function clearCookieOptions(): CookieOptions {
  return {
    path: "/",
    domain: COOKIE_DOMAIN,
    sameSite: SAME_SITE,
    secure: SECURE,
  };
}
