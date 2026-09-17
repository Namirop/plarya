import type { DemoRole } from "../lib/demo-login";
import { sendAccessUnlockedEmail, sendMagicLinkEmail } from "../lib/emails";
import { logger, maskEmail } from "../lib/logger";
import { createMagicLink, createSession, deleteSession, verifyMagicLink } from "../lib/magic-link";
import { prisma } from "../lib/prisma";

/**
 * Service d'authentification : magic-link, sessions, connexion démo.
 *
 * Les routes associées répondent de façon générique (anti-énumération) ; le
 * détail de l'issue reste interne. Le service ne touche pas au HTTP : il
 * renvoie jetons de session et chemins de redirection, la route pose le
 * cookie et redirige.
 */

// Slash final retiré pour éviter `//auth/verify` dans les liens.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

export type MagicLinkRequestOutcome =
  { delivered: true } | { delivered: false; reason: "cooldown" };

/**
 * Envoie un magic-link, sauf si l'email est en cooldown après suppression
 * de compte (table DeletedEmailCooldown, 7 jours). Le refus est journalisé ;
 * la route renvoie la même réponse dans les deux cas pour ne pas révéler
 * l'existence d'un compte récemment supprimé.
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
  // Non attendu : les échecs d'envoi sont journalisés par sendEmailWithRetry.
  sendMagicLinkEmail(normalizedEmail, link);
  return { delivered: true };
}

export type MagicLinkVerifyOutcome =
  | { status: "ok"; userId: string; sessionToken: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "deleted" };

/**
 * Consomme un magic-link, crée l'utilisateur au besoin et ouvre une session.
 * Le cooldown est revérifié ici : un lien émis juste avant la suppression du
 * compte (valable 15 min) ne doit pas permettre de le recréer.
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

/** Sans token, rien à supprimer : la route efface le cookie dans tous les cas. */
export async function logoutSession(sessionToken: string | undefined): Promise<void> {
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
}

/**
 * Renvoie l'email « Accès débloqué » (nouveau magic-link) à l'acheteur d'une
 * session Stripe. Aucune session n'est ouverte ici : seul le clic sur le lien
 * reçu par email connecte. Session inconnue : simple log, et la route répond
 * de la même façon (anti-énumération).
 */
export async function resendAccessUnlocked(stripeSessionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
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

// ── Connexion démo ──────────────────────────────────────────────────
//
// Le flag et le secret sont vérifiés par la route (voir lib/demo-login.ts) ;
// ce service résout le compte du seed et ouvre la session.

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
 * `account_missing` : compte du seed absent ou supprimé.
 * `refused` : le compte cible est ADMIN ; la connexion démo n'ouvre jamais ce
 * rôle, même si le mapping ci-dessus était modifié par erreur.
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
