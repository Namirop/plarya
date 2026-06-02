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
 * `domain` (via `COOKIE_DOMAIN`) : vide en local (cookie host-only). En
 * prod cross-subdomain (front `plarya.com` + back `api.plarya.com`),
 * poser `.plarya.com` pour que le cookie soit PARTAGÉ entre l'apex et le
 * sous-domaine. Indispensable au rendu SERVEUR des pages connectées
 * (`/compte`, `/dashboard`) : le serveur Next tourne sur `plarya.com` et
 * ne reçoit le cookie de session que s'il est scopé `.plarya.com`. Sans
 * ça, le cookie reste host-only sur `api.plarya.com`, invisible côté
 * `plarya.com` → /auth/me 401 → redirect accueil.
 *
 * Variables : `COOKIE_SAMESITE` (lax | none | strict) et `COOKIE_DOMAIN`
 * (cf. .env.example pour le détail du choix selon la topologie).
 */

const IS_PROD = process.env.NODE_ENV === "production";

const SAME_SITE = ((process.env.COOKIE_SAMESITE || "lax").toLowerCase() as
  | "lax"
  | "none"
  | "strict");

// SameSite=None EXIGE Secure (sinon cookie rejeté par le navigateur).
// Sinon : secure dès qu'on est en prod (HTTPS).
const SECURE = IS_PROD || SAME_SITE === "none";

// Domaine du cookie. undefined = host-only (dev local). En prod,
// `.plarya.com` pour partager apex + sous-domaines (cf. note ci-dessus).
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Cookie de session httpOnly (auth). */
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

/** Cookie CSRF — NON-httpOnly (le frontend doit le lire en JS). */
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

/**
 * Options à passer à `res.clearCookie()`. Pour qu'un navigateur efface
 * effectivement le cookie, les attributs `path` / `domain` / `sameSite`
 * / `secure` doivent correspondre à ceux utilisés à la pose.
 */
export function clearCookieOptions(): CookieOptions {
  return {
    path: "/",
    domain: COOKIE_DOMAIN,
    sameSite: SAME_SITE,
    secure: SECURE,
  };
}
