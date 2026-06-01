import { EMAIL_FROM, sendEmailWithRetry } from "./resend";
import {
  buildMagicLinkEmail,
  buildAccessUnlockedEmail,
  buildWinningPronoEmail,
} from "./email-templates";

// Transport des emails transactionnels : ce module ne fait QUE l'envoi
// (from + retry + logging). Le HTML/sujet vit dans `email-templates.ts`
// (module pur, testable sans clé Resend).
//
// Tous les `sendEmailWithRetry` ci-dessous sont fire-and-forget côté
// appelant (le helper swallow l'erreur finale après retries). L'argument
// `context.kind` sert au logger pour distinguer les types d'email.

/** Email magic link de connexion. */
export async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  const { subject, html } = buildMagicLinkEmail({ link });
  await sendEmailWithRetry({ from: EMAIL_FROM, to: email, subject, html }, { kind: "magic_link" });
}

/**
 * Email "Accès débloqué" avec magic link.
 *
 * Le `magicLinkUrl` reçu DOIT inclure `&redirect=/experts/{expertId}`
 * URL-encoded (construit côté webhook) pour que l'acheteur atterrisse
 * directement sur la page de l'expert. Depuis la suppression de
 * /auth/session-from-checkout, ce magic-link est la SEULE voie d'auth
 * post-paiement pour un acheteur non-loggé.
 */
export async function sendAccessUnlockedEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  magicLinkUrl: string,
): Promise<void> {
  const { subject, html } = buildAccessUnlockedEmail({ expertPseudo, expertId, magicLinkUrl });
  await sendEmailWithRetry({ from: EMAIL_FROM, to: email, subject, html }, { kind: "access_unlocked" });
}

/** Email J+1 — analyse gagnante de la veille. */
export async function sendWinningPronoEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  matchName: string,
): Promise<void> {
  const { subject, html } = buildWinningPronoEmail({ expertPseudo, expertId, matchName });
  await sendEmailWithRetry({ from: EMAIL_FROM, to: email, subject, html }, { kind: "winning_prono" });
}
