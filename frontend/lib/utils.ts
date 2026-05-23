import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Étend tailwind-merge avec les font-size tokens custom du DS Plarya.
// Sans ça, twMerge confond `text-h5` / `text-body-16` avec une utilité de
// couleur `text-*` et drop `text-black` du même bucket — résultat : le
// texte des Buttons primary/white passe en blanc hérité.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["h1", "h2", "h3", "h4", "h5", "body-16", "body-18"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
