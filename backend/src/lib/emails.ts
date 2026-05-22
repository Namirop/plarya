import { resend, EMAIL_FROM } from "./resend";

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

/** Email magic link de connexion */
export async function sendMagicLinkEmail(email: string, link: string): Promise<void> {
  try {
    await resend.emails.send({
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
    });
    console.log(`[EMAIL] Magic link sent to ${email}`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send magic link to ${email}:`, err);
  }
}

/** Email "Accès débloqué" avec magic link */
export async function sendAccessUnlockedEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  magicLinkUrl: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Votre accès aux analyses de ${expertPseudo} est débloqué !`,
      html: emailLayout(`
        <h1 style="color: #FFFFFF; font-size: 24px;">Acc&egrave;s d&eacute;bloqu&eacute; !</h1>
        <p>Votre acc&egrave;s aux analyses de <strong>${expertPseudo}</strong> est maintenant actif.</p>
        <p>Consultez ses analyses d&egrave;s maintenant :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${FRONTEND_URL}/experts/${expertId}" class="btn">Voir les analyses</a>
        </p>
        <p>Pour vous connecter &agrave; tout moment, utilisez ce lien :</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${magicLinkUrl}" style="color: #00FF41; text-decoration: underline; font-weight: 600;">Se connecter</a>
        </p>
        <p>Ou d&eacute;couvrez d'autres experts :</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${FRONTEND_URL}" style="color: #00FF41; text-decoration: underline; font-weight: 600;">D&eacute;couvrir d'autres experts</a>
        </p>
        <p class="muted" style="font-size: 14px;">Merci pour votre confiance !</p>
      `),
    });
    console.log(`[EMAIL] Access unlocked email sent to ${email} (${expertPseudo})`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send access unlocked email to ${email}:`, err);
  }
}

/** Email J+1 — analyse gagnante de la veille */
export async function sendWinningPronoEmail(
  email: string,
  expertPseudo: string,
  expertId: string,
  matchName: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "L'analyse d'hier a gagné ! ✅",
      html: emailLayout(`
        <h1 style="color: #FFFFFF; font-size: 24px;">L'analyse d'hier est pass&eacute;e ! &#127919;</h1>
        <p>L'analyse de <strong>${expertPseudo}</strong> sur <strong>${matchName}</strong> a &eacute;t&eacute; gagnante hier !</p>
        <p>D&eacute;couvrez ses s&eacute;lections du jour :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${FRONTEND_URL}/experts/${expertId}" class="btn">Voir les analyses du jour</a>
        </p>
        <p>Ou explorez d'autres experts :</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${FRONTEND_URL}" style="color: #00FF41; text-decoration: underline; font-weight: 600;">Découvrir d'autres experts</a>
        </p>
      `),
    });
    console.log(`[EMAIL] Winning prono email sent to ${email} (${expertPseudo} - ${matchName})`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send winning prono email to ${email}:`, err);
  }
}
