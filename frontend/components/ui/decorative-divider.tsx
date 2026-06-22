// Divider décoratif "ligne — point — ligne" — anciennement doré,
// neutralisé : sur la homepage, règle MAX 3 occurrences dorées, ce
// divider décoratif n'en fait pas partie.
// Garde la forme + l'opacité subtile, juste la couleur passe en blanc.
//
// Largeur : 280 px mobile (rentre dans viewport 393 sans clipping),
// 402 px desktop (valeur Figma).

const NEUTRAL_LINE_FADE =
  "linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.4) 51%, rgba(255,255,255,0.05) 100%)";

export function DecorativeDivider() {
  return (
    <div className="mx-auto flex w-[280px] md:w-[402px] items-center justify-center">
      <span
        aria-hidden
        className="h-px flex-1 md:flex-none md:w-[185px] opacity-60"
        style={{ background: NEUTRAL_LINE_FADE }}
      />
      <span
        aria-hidden
        className="mx-[13px] size-[6px] shrink-0 rounded-full bg-foreground/40"
      />
      <span
        aria-hidden
        className="h-px flex-1 md:flex-none md:w-[185px] opacity-60"
        style={{ background: NEUTRAL_LINE_FADE }}
      />
    </div>
  );
}
