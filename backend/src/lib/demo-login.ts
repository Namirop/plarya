import crypto from "crypto";

// Connexion démo aux comptes EXPERT et USER du seed, jamais ADMIN. Active
// seulement si ENABLE_DEMO_LOGIN="true" (à désactiver hors démonstration).

export const DEMO_ROLES = ["expert", "user"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && (DEMO_ROLES as readonly string[]).includes(value);
}

export function isDemoLoginEnabled(): boolean {
  return process.env.ENABLE_DEMO_LOGIN === "true";
}

/** Comparaison en temps constant ; la route répond 404 sur tout échec. */
export function isValidDemoKey(provided: string | undefined): boolean {
  const secret = process.env.DEMO_LOGIN_SECRET;
  if (!secret || !provided) return false;

  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  if (providedBuf.length !== secretBuf.length) return false;

  return crypto.timingSafeEqual(providedBuf, secretBuf);
}
