import { EMAIL_FROM, sendEmailWithRetry } from "./resend";
import {
  buildMagicLinkEmail,
  buildAccessUnlockedEmail,
  buildWinningPronoEmail,
} from "./email-templates";

// Envoi des emails transactionnels (contenu dans email-templates.ts).
// Les échecs sont journalisés par sendEmailWithRetry et jamais propagés.

export async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  const { subject, html } = buildMagicLinkEmail({ link });
  await sendEmailWithRetry({ from: EMAIL_FROM, to: email, subject, html }, { kind: "magic_link" });
}

/** Voir buildAccessUnlockedEmail pour le format attendu de `magicLinkUrl`. */
export async function sendAccessUnlockedEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  magicLinkUrl: string,
): Promise<void> {
  const { subject, html } = buildAccessUnlockedEmail({ expertPseudo, expertId, magicLinkUrl });
  await sendEmailWithRetry(
    { from: EMAIL_FROM, to: email, subject, html },
    { kind: "access_unlocked" },
  );
}

export async function sendWinningPronoEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  matchName: string,
): Promise<void> {
  const { subject, html } = buildWinningPronoEmail({ expertPseudo, expertId, matchName });
  await sendEmailWithRetry(
    { from: EMAIL_FROM, to: email, subject, html },
    { kind: "winning_prono" },
  );
}
