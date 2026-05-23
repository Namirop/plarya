// Divider décoratif "ligne — point — ligne" du Figma (frame `80:736`).
// 2 traits dorés qui s'estompent aux extrémités, séparés par un dot
// doré central de 6 × 6 px. Couleur accent doré (#DFB968).
// Cf. final-blocks-spec.md / homepage-spec.md §7a.
//
// Largeur : 280 px mobile (rentre dans viewport 393 sans clipping),
// 402 px desktop (valeur Figma). Sur mobile, le `w-[402px]` initial
// débordait du viewport et le centrage `mx-auto` n'arrivait plus à
// le compenser proprement (la boule se retrouvait visuellement décalée).

const GOLD_LINE_FADE =
  "linear-gradient(to right, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";

export function DecorativeDivider() {
  return (
    <div className="mx-auto flex w-[280px] md:w-[402px] items-center justify-center">
      <span
        aria-hidden
        className="h-px flex-1 md:flex-none md:w-[185px] opacity-60"
        style={{ background: GOLD_LINE_FADE }}
      />
      <span aria-hidden className="mx-[13px] size-[6px] shrink-0 rounded-full bg-accent" />
      <span
        aria-hidden
        className="h-px flex-1 md:flex-none md:w-[185px] opacity-60"
        style={{ background: GOLD_LINE_FADE }}
      />
    </div>
  );
}
