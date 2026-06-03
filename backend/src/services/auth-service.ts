import type { DemoRole } from "../lib/demo-login";
import { sendAccessUnlockedEmail, sendMagicLinkEmail } from "../lib/emails";
import { logger, maskEmail } from "../lib/logger";
import { createMagicLink, createSession, deleteSession, verifyMagicLink } from "../lib/magic-link";
import { prisma } from "../lib/prisma";

/**
 * Service Auth — magic-link, sessions, et flows associés.
 *
 * Stratégie anti-énumération : la grande majorité des endpoints
 * adjacents (request-magic-link, resend-access-unlocked) renvoient une
 * réponse 200 générique au caller, peu importe l'état réel. Le service
 * renvoie un objet `{ delivered: boolean, reason?: string }` au caller
 * qui peut logger discriminé en INTERNE sans le leak côté HTTP.
 *
 * Le service ne pose AUCUN cookie côté HTTP. Quand un flow doit poser
 * une session (verify magic-link), le service renvoie un session token
 * et c'est à la route de set le cookie via setSessionCookie helper.
 * Idem pour les redirects — l'URL est retournée, pas exécutée.
 */

// Slash final retiré → pas de `//auth/verify` dans le magic-link.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export type MagicLinkRequestOutcome =
  | { delivered: true }
  | { delivered: false; reason: "cooldown" };

/**
 * Envoie un magic-link à l'email donné, sauf si l'email est en cooldown
 * post-suppression (cf. table DeletedEmailCooldown — empêche la
 * recréation immédiate d'un compte 7j après soft-delete).
 *
 * fire-and-forget côté email : le service log un warning si cooldown
 * actif (pour traçabilité interne) mais renvoie le même outcome côté
 * caller — la réponse HTTP doit rester identique aux deux cas pour ne
 * pas leaker l'existence d'un compte récemment supprimé.
 */
export async function requestMagicLink(
  rawEmail: string,
  context: { ip?: string },
): Promise<MagicLinkRequestOutcome> {
  const normalizedEmail = rawEmail.toLowerCase();

  const cooldown = await prisma.deletedEmailCooldown.findFirst({
    where: { email: normalizedEmail, expiresAt: { gt: new Date() } },
    select: { id: true, expiresAt: true },
  });

  if (cooldown) {
    logger.warn(
      {
        email: maskEmail(normalizedEmail),
        cooldownExpiresAt: cooldown.expiresAt,
        ip: context.ip,
      },
      "Magic-link request blocked: email in deletion cooldown",
    );
    return { delivered: false, reason: "cooldown" };
  }

  const token = await createMagicLink(normalizedEmail);
  const link = `${BACKEND_URL}/auth/verify?token=${token}`;
  // fire-and-forget — sendEmailWithRetry log les échecs en error
  sendMagicLinkEmail(normalizedEmail, link);
  return { delivered: true };
}

export type MagicLinkVerifyOutcome =
  | { status: "ok"; userId: string; sessionToken: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "deleted" };

/**
 * Vérifie un magic-link, crée le user si nécessaire, génère une session.
 *
 * Garde-fou cooldown post-suppression : même si un magic-link a pu
 * être créé avant ou pendant la suppression du compte (race), on
 * refuse sa consommation tant que la fenêtre de cooldown n'est pas
 * expirée. Sinon un user qui a un lien encore valide en cache (15 min)
 * pourrait recréer un compte juste après suppression.
 */
export async function verifyMagicLinkAndCreateSession(
  token: string,
  context: { ip?: string },
): Promise<MagicLinkVerifyOutcome> {
  if (!token) {
    return { status: "invalid" };
  }

  const result = await verifyMagicLink(token);
  if (!result) {
    return { status: "expired" };
  }

  const cooldown = await prisma.deletedEmailCooldown.findFirst({
    where: { email: result.email, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  if (cooldown) {
    logger.warn(
      { email: maskEmail(result.email), ip: context.ip },
      "Magic-link verify blocked: email in deletion cooldown",
    );
    return { status: "deleted" };
  }

  let user = await prisma.user.findUnique({ where: { email: result.email } });
  if (!user) {
    user = await prisma.user.create({ data: { email: result.email } });
  }

  const sessionToken = await createSession(user.id);
  return { status: "ok", userId: user.id, sessionToken };
}

/**
 * Supprime la session liée au token (logout). Best-effort : si pas de
 * token côté caller, on no-op (la route clear le cookie de toute façon).
 */
export async function logoutSession(sessionToken: string | undefined): Promise<void> {
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
}

/**
 * Renvoie l'email d'accès-débloqué pour un user qui a déjà payé une
 * subscription via Stripe mais n'a pas reçu le mail initial (spam,
 * Resend down).
 *
 * Sécurité : ne pose AUCUNE session ici (vs l'ancien
 * /auth/session-from-checkout supprimé qui posait un cookie depuis
 * l'URL Stripe — vecteur d'élévation si l'URL fuitait). Le service
 * renvoie juste un nouveau magic-link par email ; la session ne sera
 * posée qu'après clic effectif sur le magic-link.
 *
 * Toujours { delivered: true } côté caller — on ne leak pas
 * l'existence d'une Subscription Stripe (anti-énumération).
 */
export async function resendAccessUnlocked(stripeSessionId: string): Promise<void> {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSessionId },
    include: {
      user: { select: { email: true } },
      expert: { select: { id: true, pseudo: true } },
    },
  });

  if (!subscription) {
    logger.warn({ stripeSessionId }, "Resend access requested for unknown stripeSessionId");
    return;
  }

  const magicToken = await createMagicLink(subscription.user.email);
  const redirectTarget = encodeURIComponent(`/experts/${subscription.expert.id}`);
  const magicLinkUrl = `${BACKEND_URL}/auth/verify?token=${magicToken}&redirect=${redirectTarget}`;
  // fire-and-forget — sendEmailWithRetry log déjà les échecs
  sendAccessUnlockedEmail(
    subscription.user.email,
    subscription.expert.pseudo,
    subscription.expert.id,
    magicLinkUrl,
  );
  logger.info(
    { stripeSessionId, subscriptionId: subscription.id },
    "Access unlocked email re-sent",
  );
}

// ── Connexion démo (phase démo client) ──────────────────────────────
//
// Cf. lib/demo-login.ts pour le gating (flag + secret). Ce service ne
// fait que résoudre le compte démo et poser une session — il NE vérifie
// PAS le flag/secret (responsabilité de la route HTTP). Mapping figé
// vers les comptes seedés ; aucun ADMIN possible (garde-fou explicite).

const DEMO_ROLE_EMAILS: Record<DemoRole, string> = {
  expert: "expert@test.com",
  user: "user@test.com",
};

const DEMO_ROLE_REDIRECT: Record<DemoRole, string> = {
  expert: "/dashboard",
  user: "/compte",
};

export type DemoLoginOutcome =
  | { status: "ok"; sessionToken: string; redirectPath: string }
  | { status: "account_missing" }
  | { status: "refused" };

/**
 * Crée une session pour un compte démo (expert ou user), sans email ni
 * mot de passe — UNIQUEMENT pour montrer ces espaces au client.
 *
 *  - `account_missing` : le compte seedé n'existe pas (ou est supprimé)
 *    → le seed n'a pas tourné sur cet environnement.
 *  - `refused` : garde-fou — la connexion démo ne doit JAMAIS ouvrir un
 *    compte ADMIN, même si le mapping email était modifié par erreur.
 *    L'admin réel passe exclusivement par le magic-link.
 */
export async function createDemoLoginSession(role: DemoRole): Promise<DemoLoginOutcome> {
  const email = DEMO_ROLE_EMAILS[role];

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { status: "account_missing" };
  }
  if (user.role === "ADMIN") {
    logger.warn({ role, email: maskEmail(email) }, "Demo login refused: target is ADMIN");
    return { status: "refused" };
  }

  const sessionToken = await createSession(user.id);
  return { status: "ok", sessionToken, redirectPath: DEMO_ROLE_REDIRECT[role] };
}
