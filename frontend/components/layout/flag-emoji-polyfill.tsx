"use client";

import { useEffect } from "react";

import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

// Windows affiche les emojis drapeaux comme des lettres ("FR"). Le polyfill
// charge la police « Twemoji Country Flags » (depuis jsDelivr, à autoriser si
// une CSP est ajoutée), appliquée via la classe `.flag-emoji` de globals.css.

export function FlagEmojiPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);
  return null;
}
