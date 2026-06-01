// Templates HTML des emails transactionnels Plarya.
//
// Module PUR : aucune dépendance au transport Resend. Il ne fait que
// construire `{ subject, html }` — ce qui isole la logique d'envoi
// (retry, logging) dans emails.ts et garde les templates testables sans
// clé Resend.
//
// Contraintes "email-safe" (Gmail / Apple Mail / Outlook) :
//  - layout en <table> + styles INLINE (pas de fl/grid, pas de <style>
//    externe fiable),
//  - PAS de `background-clip:text` (le gradient doré des titres du site
//    n'est pas rendu en mail) → bouton en or aplat solide, et logo via
//    le PNG `email-logo.png` servi par le front (recadré serré depuis
//    full-logo-remove.png : symbole + wordmark PLARYA dorés, transparent),
//  - les polices de marque (Mona Sans / Hubot Sans) ne se chargent pas
//    en mail → stack système. L'identité DA passe par le noir + l'or +
//    la mise en page, pas par la police.

import { escapeHtml } from "./format";

// `.replace` : retire un éventuel slash final pour ne pas générer d'URL
// en `//...` (logo email, liens) si la var d'env en contient un.
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Palette DA Plarya, valeurs email-safe (hex/rgba inline).
const C = {
  bg: "#000000",
  surface: "#0E0E0E",
  gold: "#DFB968",
  goldStrong: "#E1AA36",
  text: "#FFFFFF",
  textSoft: "#D8D2C8",
  muted: "#8A8181",
  border: "rgba(223,185,104,0.22)",
};

function h1(text: string): string {
  return `<h1 style="margin:0 0 18px;font-family:${FONT};font-size:23px;line-height:1.3;font-weight:700;color:${C.text};">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.62;color:${C.textSoft};">${text}</p>`;
}

function note(text: string): string {
  return `<p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">${text}</p>`;
}

// Bouton CTA "bulletproof" : table + <a> en inline-block, or en aplat,
// texte noir gras. Centré via align="center" + margin auto.
function button(href: string, label: string): string {
  return `
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 8px;">
          <tr>
            <td align="center" bgcolor="${C.gold}" style="border-radius:10px;">
              <a href="${href}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${FONT};font-size:16px;font-weight:700;line-height:1;color:#000000;text-decoration:none;border-radius:10px;">${label}</a>
            </td>
          </tr>
        </table>`;
}

function secondaryLink(href: string, label: string): string {
  return `<a href="${href}" target="_blank" style="color:${C.gold};text-decoration:underline;font-weight:600;">${label}</a>`;
}

// Coquille commune : wordmark doré + slogan, carte sombre à filet doré
// avec liseré doré en tête, footer discret.
function layout(opts: { preheader: string; title: string; body: string }): string {
  const { preheader, title, body } = opts;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
<tr><td align="center" style="padding:2px 0 18px;">
<a href="${FRONTEND_URL}" target="_blank" style="text-decoration:none;display:inline-block;">
<img src="${FRONTEND_URL}/email-logo.png" alt="PLARYA" width="190" style="display:block;width:190px;max-width:190px;height:auto;border:0;outline:none;text-decoration:none;">
</a>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.goldStrong};border-radius:16px;">
<tr><td style="padding:3px 0 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.surface};border:1px solid ${C.border};border-top:0;border-radius:0 0 16px 16px;">
<tr><td style="padding:34px 34px 38px;">
${body}
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:26px 16px 6px;">
<div style="font-family:${FONT};font-size:12px;color:${C.muted};line-height:1.7;">
Plarya &mdash; Plateforme d'analyses sportives premium<br>
<a href="mailto:contact@plarya.com" style="color:${C.muted};text-decoration:underline;">contact@plarya.com</a>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Email magic link de connexion. */
export function buildMagicLinkEmail(params: { link: string }): { subject: string; html: string } {
  return {
    subject: "Votre lien de connexion Plarya",
    html: layout({
      preheader: "Votre lien de connexion sécurisé — valable 15 minutes.",
      title: "Votre lien de connexion",
      body:
        h1("Votre lien de connexion") +
        p("Cliquez sur le bouton ci-dessous pour vous connecter à Plarya.") +
        button(params.link, "Se connecter") +
        note(
          "Ce lien expire dans 15 minutes et ne peut être utilisé qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        ),
    }),
  };
}

/**
 * Email "Accès débloqué" avec magic link.
 *
 * Le `magicLinkUrl` reçu DOIT inclure `&redirect=/experts/{expertId}`
 * URL-encoded (construit côté webhook) pour que l'acheteur atterrisse
 * directement sur la page de l'expert. C'est la seule voie d'auth
 * post-paiement pour un acheteur non-loggé.
 */
export function buildAccessUnlockedEmail(params: {
  expertPseudo: string;
  expertId: string;
  magicLinkUrl: string;
}): { subject: string; html: string } {
  // pseudo = user-controlled (set par l'expert) → escape obligatoire.
  const safePseudo = escapeHtml(params.expertPseudo);
  return {
    subject: `Votre accès aux analyses de ${params.expertPseudo} est débloqué`,
    html: layout({
      preheader: `Accès actif aux analyses de ${safePseudo}. Connectez-vous en un clic.`,
      title: "Accès débloqué",
      body:
        `<div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.14em;color:${C.gold};margin:0 0 12px;">&#10003;&nbsp;ACC&Egrave;S D&Eacute;BLOQU&Eacute;</div>` +
        h1(`Vos analyses de ${safePseudo} vous attendent`) +
        p(
          `Votre accès aux analyses de <strong style="color:${C.text};">${safePseudo}</strong> est maintenant actif.`,
        ) +
        p("Connectez-vous en un clic pour accéder directement à ses sélections du jour.") +
        button(params.magicLinkUrl, "Accéder à mes analyses") +
        note("Ce lien expire dans 15 minutes et ne peut être utilisé qu'une seule fois.") +
        `<p style="margin:20px 0 0;font-family:${FONT};font-size:14px;color:${C.textSoft};">Envie d'aller plus loin&nbsp;? ${secondaryLink(FRONTEND_URL, "Découvrir d'autres experts")}.</p>`,
    }),
  };
}

/** Email J+1 — analyse gagnante de la veille. */
export function buildWinningPronoEmail(params: {
  expertPseudo: string;
  expertId: string;
  matchName: string;
}): { subject: string; html: string } {
  // pseudo + matchName = user-controlled (DB, set par l'expert) → escape.
  const safePseudo = escapeHtml(params.expertPseudo);
  const safeMatchName = escapeHtml(params.matchName);
  return {
    subject: "L'analyse d'hier est passée 🎯",
    html: layout({
      preheader: `${safePseudo} a vu juste hier — découvrez ses sélections du jour.`,
      title: "L'analyse d'hier est passée",
      body:
        h1("L'analyse d'hier est pass&eacute;e &#127919;") +
        p(
          `L'analyse de <strong style="color:${C.text};">${safePseudo}</strong> sur <strong style="color:${C.text};">${safeMatchName}</strong> a été gagnante hier.`,
        ) +
        p("Ne manquez pas ses sélections du jour.") +
        button(`${FRONTEND_URL}/experts/${params.expertId}`, "Voir les analyses du jour") +
        `<p style="margin:20px 0 0;font-family:${FONT};font-size:14px;color:${C.textSoft};">Ou explorez ${secondaryLink(FRONTEND_URL, "d'autres experts")}.</p>`,
    }),
  };
}
