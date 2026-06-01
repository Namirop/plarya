// Génère un aperçu navigateur des emails transactionnels.
//
//   npx tsx scripts/preview-emails.ts   (depuis backend/)
//
// Écrit backend/email-preview.html : les 3 emails rendus dans des
// <iframe srcdoc> (isolation fidèle au rendu boîte mail). Aucun envoi,
// aucune clé Resend requise (les builders sont un module pur).

import { writeFileSync } from "fs";
import { join } from "path";
import {
  buildMagicLinkEmail,
  buildAccessUnlockedEmail,
  buildWinningPronoEmail,
} from "../src/lib/email-templates";

const DEMO_LINK = "https://www.plarya.com/auth/verify?token=demo-token";

const samples = [
  buildMagicLinkEmail({ link: DEMO_LINK }),
  buildAccessUnlockedEmail({ expertPseudo: "BetKing", expertId: "demo", magicLinkUrl: DEMO_LINK }),
  buildWinningPronoEmail({ expertPseudo: "TennisAce", expertId: "demo", matchName: "Djokovic - Alcaraz" }),
];

const frames = samples
  .map((s) => {
    const srcdoc = s.html.replace(/"/g, "&quot;");
    return `
    <div class="lbl">Sujet&nbsp;: ${s.subject}</div>
    <iframe class="frame" srcdoc="${srcdoc}"></iframe>`;
  })
  .join("\n");

const page = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Plarya — aperçu des emails</title>
<style>
  body { margin:0; background:#1b1b1b; font-family:-apple-system,Segoe UI,Roboto,sans-serif; }
  .wrap { max-width:680px; margin:0 auto; padding:24px 12px 64px; }
  h1 { color:#DFB968; font-size:18px; font-weight:700; }
  .lbl { color:#c9c2b4; font-size:13px; padding:28px 4px 10px; }
  .frame { width:100%; height:640px; border:1px solid #333; border-radius:8px; background:#000; }
</style>
</head>
<body>
<div class="wrap">
<h1>Plarya — aperçu des emails transactionnels</h1>
${frames}
</div>
</body>
</html>`;

const out = join(__dirname, "..", "email-preview.html");
writeFileSync(out, page, "utf8");
console.log("Aperçu écrit : " + out);
