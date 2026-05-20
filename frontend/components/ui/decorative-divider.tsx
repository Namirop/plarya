// Divider décoratif "ligne — point — ligne" du Figma (frame `80:736`).
// 2 traits dorés de 185 px qui s'estompent aux extrémités, séparés par
// un dot doré central de 6 × 6 px (gap 13 px entre chaque trait et le dot).
// Couleur accent doré (#DFB968). Cf. final-blocks-spec.md / homepage-spec.md §7a.
//
// Largeur totale : 185 + 13 + 6 + 13 + 185 = 402 px (= dimensions Figma).

const GOLD_LINE_FADE =
  "linear-gradient(to right, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";

export function DecorativeDivider() {
  return (
    <div className="mx-auto flex w-[402px] items-center justify-center">
      <span
        aria-hidden
        className="h-px w-[185px] opacity-60"
        style={{ background: GOLD_LINE_FADE }}
      />
      <span
        aria-hidden
        className="mx-[13px] size-[6px] shrink-0 rounded-full bg-accent"
      />
      <span
        aria-hidden
        className="h-px w-[185px] opacity-60"
        style={{ background: GOLD_LINE_FADE }}
      />
    </div>
  );
}
