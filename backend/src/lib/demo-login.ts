import crypto from "crypto";

/**
 * Connexion démo 1-clic — UNIQUEMENT pour MONTRER les espaces EXPERT et
 * USER au client pendant la phase démo (sans email ni mot de passe).
 *
 * Sécurité & cycle de vie :
 *  - Désactivé par défaut. Actif SEULEMENT si `ENABLE_DEMO_LOGIN="true"`.
 *  - Protégé par `DEMO_LOGIN_SECRET` (comparé en temps constant).
 *  - Ne donne JAMAIS accès au rôle ADMIN : l'admin est un compte sérieux
 *    et permanent (`contact@plarya.com`) qui passe exclusivement par le
 *    vrai magic-link. Le garde-fou ADMIN est dans `createDemoLoginSession`.
 *  - À COUPER avant le lancement : passer `ENABLE_DEMO_LOGIN=false` (ou
 *    retirer la variable) sur Railway. Aucune autre action requise — le
 *    reste du code reste inerte tant que le flag est off.
 *
 * Comptes ciblés : `expert@test.com` / `user@test.com`, créés par le
 * seed (`npm run db:seed`). Si le seed n'a pas tourné, la route répond
 * 503 (cf. route /auth/demo-login).
 */

export const DEMO_ROLES = ["expert", "user"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && (DEMO_ROLES as readonly string[]).includes(value);
}

/** Le flag maître. Tout le flow démo est inerte tant qu'il n'est pas "true". */
export function isDemoLoginEnabled(): boolean {
  return process.env.ENABLE_DEMO_LOGIN === "true";
}

/**
 * Compare la clé fournie au secret en temps constant.
 *
 * Fail-closed : renvoie `false` si le secret n'est pas configuré ou si
 * la clé est absente. La comparaison de longueur en amont est nécessaire
 * car `crypto.timingSafeEqual` exige des buffers de même taille (il jette
 * sinon) — on ne révèle pas pour autant la longueur du secret puisque la
 * réponse HTTP est un 404 indifférencié dans tous les cas.
 */
export function isValidDemoKey(provided: string | undefined): boolean {
  const secret = process.env.DEMO_LOGIN_SECRET;
  if (!secret || !provided) return false;

  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  if (providedBuf.length !== secretBuf.length) return false;

  return crypto.timingSafeEqual(providedBuf, secretBuf);
}
