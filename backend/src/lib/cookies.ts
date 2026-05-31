import type { CookieOptions } from "express";

/**
 * Options de cookies centralisées — session + CSRF.
 *
 * Le point sensible est `sameSite`, qui dépend de la TOPOLOGIE de
 * déploiement :
 *  - **Same-origin** (dev local, ou frontend + backend sous le même
 *    eTLD+1, ex `plarya.com` + `api.plarya.com`) → `lax` suffit et
 *    reste le choix le plus sûr.
 *  - **Cross-site** (cas Vercel + Railway : `plarya.vercel.app` +
 *    `plarya-api.up.railway.app` = sites différents) → le navigateur
 *    n'enverra le cookie de session sur les requêtes cross-site QUE si
 *    `sameSite: "none"` + `secure: true`. Sans ça, l'utilisateur ne
 *    reste jamais connecté (le cookie est posé mais jamais renvoyé).
 *
 * On rend donc `sameSite` configurable via `COOKIE_SAMESITE`
 * (lax | none | strict, défaut `lax`). Quand il vaut `none`, on force
 * `secure: true` car les navigateurs rejettent un cookie
 * `SameSite=None` non-Secure.
 *
 * Voir docs/deploiement.md §Cookies pour le choix selon l'hébergement.
 */

const IS_PROD = process.env.NODE_ENV === "production";

const SAME_SITE = ((process.env.COOKIE_SAMESITE || "lax").toLowerCase() as
  | "lax"
  | "none"
  | "strict");

// SameSite=None EXIGE Secure (sinon cookie rejeté par le navigateur).
// Sinon : secure dès qu'on est en prod (HTTPS).
const SECURE = IS_PROD || SAME_SITE === "none";

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Cookie de session httpOnly (auth). */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: SECURE,
    sameSite: SAME_SITE,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  };
}

/** Cookie CSRF — NON-httpOnly (le frontend doit le lire en JS). */
export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: SECURE,
    sameSite: SAME_SITE,
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  };
}

/**
 * Options à passer à `res.clearCookie()`. Pour qu'un navigateur efface
 * effectivement le cookie, les attributs `path` / `sameSite` / `secure`
 * doivent correspondre à ceux utilisés à la pose.
 */
export function clearCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: SAME_SITE,
    secure: SECURE,
  };
}
