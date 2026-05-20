import { cn } from "@/lib/utils";

// Bordure 1px en dégradé angulaire (conic-gradient) : 2 pics dorés
// visibles (haut-gauche + bas-droite, placés via `from 30deg`), zones
// sombres remplacées par `transparent` pour se fondre dans le fond de
// page (anciennement #181818 / #100E0E qui créaient des traits gris
// visibles — Figma fait disparaître les coins sombres). Technique :
// overlay absolu avec padding 1 px + mask-composite pour ne garder que
// le contour. L'intérieur reste transparent (on voit le contenu
// sous-jacent au travers).
//
// À placer dans un parent `relative` qui définit la zone à border. Pour
// matcher le radius du parent, passer la même classe `rounded-*` via
// `className`.
export interface GoldenBorderOverlayProps {
  /** Classes additionnelles — typiquement `rounded-*` pour matcher le parent. */
  className?: string;
}

export function GoldenBorderOverlay({ className }: GoldenBorderOverlayProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-2xl opacity-70",
        className,
      )}
      style={{
        padding: "1px",
        background:
          "conic-gradient(from 30deg, transparent 8%, #DFB968 33%, transparent 47%, transparent 63%, #DFB968 75%, transparent 100%)",
        WebkitMask:
          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
      }}
    />
  );
}
