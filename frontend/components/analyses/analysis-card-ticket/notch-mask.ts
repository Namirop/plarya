import type { CSSProperties } from "react";

// 4 encoches semi-circulaires (G/D, en haut et en bas). Chaque gradient
// est transparent au centre du trou et opaque (#000) partout ailleurs ;
// `mask-composite: intersect` ne garde visible que ce qui est opaque
// dans TOUS les calques → les trous se cumulent.
const NOTCH = (() => {
  const hole = (at: string) => `radial-gradient(circle 9px at ${at}, transparent 8px, #000 9px)`;
  return [
    hole("0 80px"),
    hole("100% 80px"),
    hole("0 calc(100% - 80px)"),
    hole("100% calc(100% - 80px)"),
  ].join(", ");
})();

export const ticketMask: CSSProperties = {
  maskImage: NOTCH,
  WebkitMaskImage: NOTCH,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskComposite: "intersect",
};
