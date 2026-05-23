import { EMAIL_FROM, sendEmailWithRetry } from "./resend";
import { escapeHtml } from "./format";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #000000; font-family: 'Inter', Arial, sans-serif; color: #FFFFFF; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; padding-bottom: 32px; border-bottom: 1px solid #18181B; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 700; color: #FFFFFF; text-decoration: none; }
    .logo span { color: #00FF41; }
    .content { padding: 0; }
    .btn { display: inline-block; background-color: #00FF41; color: #000000; padding: 14px 28px; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 6px; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #18181B; text-align: center; color: #71717A; font-size: 12px; }
    p { color: #FFFFFF; line-height: 1.6; font-size: 16px; }
    .muted { color: #71717A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${FRONTEND_URL}" class="logo">Plarya</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="muted">Plarya &mdash; Plateforme d'analyses sportives premium</p>
    </div>
  </div>
</body>
</html>`;
}

// Note : tous les `sendEmailWithRetry` ci-dessous sont fire-and-
// forget côté appelant (le helper swallow l'erreur finale après
// retries). Logging structuré géré dans `lib/resend.ts`. L'argument
// `context.kind` sert au logger pour distinguer les types d'email.

/** Email magic link de connexion */
export async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  await sendEmailWithRetry(
    {
      from: EMAIL_FROM,
      to: email,
      subject: "Votre lien de connexion Plarya",
      html: emailLayout(`
        <h1 style="color: #FFFFFF; font-size: 24px;">Votre lien de connexion</h1>
        <p>Cliquez sur le bouton ci-dessous pour vous connecter &agrave; Plarya :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}" class="btn">Se connecter</a>
        </p>
        <p class="muted" style="font-size: 14px;">Ce lien expire dans 15 minutes et ne peut &ecirc;tre utilis&eacute; qu'une seule fois.</p>
        <p class="muted" style="font-size: 14px;">Si vous n'avez pas demand&eacute; ce lien, ignorez cet email.</p>
      `),
    },
    { kind: "magic_link" },
  );
}

/** Email "Accès débloqué" avec magic link
 *
 * Le `magicLinkUrl` reçu en arg DOIT inclure
 * `&redirect=/experts/{expertId}` URL-encoded pour que l'user
 * atterrisse directement sur la page de l'expert qu'il vient
 * d'acheter (cf. webhooks.ts construction). Depuis la suppression
 * de /auth/session-from-checkout (sprint refonte 2 phase 2), ce
 * magic-link est la SEULE voie d'authentification post-paiement
 * pour un acheteur non-loggé.
 */
export async function sendAccessUnlockedEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  magicLinkUrl: string,
): Promise<void> {
  // Escape user-controlled : pseudo peut contenir des caractères
  // HTML dangereux. expertId est un cuid contrôlé backend, pas
  // besoin d'escape. magicLinkUrl est construit côté serveur
  // (token + redirect), idem.
  const safePseudo = escapeHtml(expertPseudo);
  await sendEmailWithRetry(
    {
      from: EMAIL_FROM,
      to: email,
      subject: `Votre accès aux analyses de ${expertPseudo} est débloqué !`,
      html: emailLayout(`
        <h1 style="color: #FFFFFF; font-size: 24px;">Acc&egrave;s d&eacute;bloqu&eacute; !</h1>
        <p>Votre acc&egrave;s aux analyses de <strong>${safePseudo}</strong> est maintenant actif.</p>
        <p>Cliquez sur le bouton ci-dessous pour vous connecter et acc&eacute;der directement aux analyses :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${magicLinkUrl}" class="btn">Acc&eacute;der &agrave; mes analyses</a>
        </p>
        <p class="muted" style="font-size: 14px;">Ce lien expire dans 15 minutes et ne peut &ecirc;tre utilis&eacute; qu'une seule fois.</p>
        <p>Ou d&eacute;couvrez d'autres experts :</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${FRONTEND_URL}" style="color: #00FF41; text-decoration: underline; font-weight: 600;">D&eacute;couvrir d'autres experts</a>
        </p>
        <p class="muted" style="font-size: 14px;">Merci pour votre confiance !</p>
      `),
    },
    { kind: "access_unlocked" },
  );
}

/** Email J+1 — analyse gagnante de la veille */
export async function sendWinningPronoEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  matchName: string,
): Promise<void> {
  // Escape user-controlled : pseudo (Expert.pseudo) et matchName
  // (Prono.matchName) viennent de la DB côté user (set par l'expert
  // via le dashboard). expertId = cuid backend, pas d'escape.
  const safePseudo = escapeHtml(expertPseudo);
  const safeMatchName = escapeHtml(matchName);
  await sendEmailWithRetry(
    {
      from: EMAIL_FROM,
      to: email,
      subject: "L'analyse d'hier a gagné ! ✅",
      html: emailLayout(`
        <h1 style="color: #FFFFFF; font-size: 24px;">L'analyse d'hier est pass&eacute;e ! &#127919;</h1>
        <p>L'analyse de <strong>${safePseudo}</strong> sur <strong>${safeMatchName}</strong> a &eacute;t&eacute; gagnante hier !</p>
        <p>D&eacute;couvrez ses s&eacute;lections du jour :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${FRONTEND_URL}/experts/${expertId}" class="btn">Voir les analyses du jour</a>
        </p>
        <p>Ou explorez d'autres experts :</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${FRONTEND_URL}" style="color: #00FF41; text-decoration: underline; font-weight: 600;">Découvrir d'autres experts</a>
        </p>
      `),
    },
    { kind: "winning_prono" },
  );
}
