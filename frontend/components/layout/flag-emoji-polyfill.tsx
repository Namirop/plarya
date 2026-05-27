"use client";

import { useEffect } from "react";

import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

// Polyfill pour les emojis drapeaux nationaux — Windows ne supporte
// pas nativement le rendu des regional indicator pairs (🇫🇷 etc.) et
// les affiche comme du texte ("FR", "GB"…). Le polyfill charge la
// font "Twemoji Country Flags" (~60KB) qui rend correctement les
// drapeaux sur toutes les plateformes, y compris Windows.
//
// La font est servie depuis jsdelivr par défaut (pas de CSP frontend
// pour bloquer). Une fois `polyfillCountryFlagEmojis()` appelé, il
// suffit d'appliquer `font-family: "Twemoji Country Flags", …` sur
// les éléments qui contiennent des emojis drapeaux. Pour Plarya, on
// applique cette font-family via une classe utility globale (cf.
// globals.css : `.flag-emoji`).
//
// Appelé une seule fois côté client au mount de l'app, dans le
// RootLayout.

export function FlagEmojiPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);
  return null;
}
