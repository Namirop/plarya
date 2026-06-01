import { cn } from "@/lib/utils";

// Liseré doré ESTOMPÉ mais NET — "coins lumineux qui se fondent dans le
// fond" (vif en haut-gauche + bas-droite, dissous ailleurs).
//
// Deux ingrédients combinés :
//  1. La LARGEUR du trait = une vraie bordure CSS (1px). Le navigateur la
//     cale sur la grille de pixels → nette et continue à tous les zooms.
//  2. L'ESTOMPAGE = un masque conic appliqué par-dessus, qui ne fait que
//     moduler l'OPACITÉ du trait LE LONG de son périmètre (transition
//     douce, grande échelle).
//
// C'est la clé vs l'ancienne version : avant, le masque créait l'anneau
// 1px LUI-MÊME (mask-composite xor) → ses bords EN TRAVERS de la largeur
// tombaient sur des sous-pixels → anti-aliasing inégal, trait pâle /
// discontinu à 100 %. Ici le masque varie seulement LE LONG du trait
// (pas en travers de sa largeur), donc aucun AA de largeur : les zones
// vives restent nettes, et le reste se dissout en douceur.
//
// Parent `relative` ; matcher le radius via `className` (rounded-*).
//
// Le conic est calé pour des cards "paysage" (hero, "Devenir créateur") :
// pics dorés ~haut-gauche (33 %) et ~bas-droite (75 %), transparent
// ailleurs — identique au rendu d'origine.
const FADE_MASK =
  "conic-gradient(from 30deg, transparent 8%, #000 33%, transparent 47%, transparent 63%, #000 75%, transparent 100%)";

export interface GoldenBorderOverlayProps {
  /** Classes additionnelles — typiquement `rounded-*` pour matcher le parent. */
  className?: string;
}

export function GoldenBorderOverlay({ className }: GoldenBorderOverlayProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-2xl border border-accent/80",
        className,
      )}
      style={{
        WebkitMaskImage: FADE_MASK,
        maskImage: FADE_MASK,
      }}
    />
  );
}
