import { cn } from "@/lib/utils";

// Bordure 1px en dégradé sur 2 zones dorées :
//
// - variant "corners" (défaut, cards rectangulaires) : conic-gradient
//   from 30deg → pics dorés en haut-gauche + bas-droite, zones sombres
//   transparentes pour se fondre dans le fond. Utilisé par le Hero +
//   "Devenir créateur".
//
// - variant "pill" (boutons capsule, topbar) : linear-gradient
//   horizontal → pics dorés sur les 2 extrémités (gauche/droite),
//   transparent au centre. Le conic-gradient produit des artefacts
//   sur une forme arrondie type pill (la transition angulaire ne
//   s'aligne pas avec les bords).
//
// Technique : overlay absolu avec padding 1 px + mask-composite pour
// ne garder que le contour. L'intérieur reste transparent (on voit le
// contenu sous-jacent au travers).
//
// À placer dans un parent `relative` qui définit la zone à border. Pour
// matcher le radius du parent, passer la même classe `rounded-*` via
// `className`.
export interface GoldenBorderOverlayProps {
  /** Classes additionnelles — typiquement `rounded-*` pour matcher le parent. */
  className?: string;
  /** Forme du parent — pilote le gradient utilisé pour les pics dorés. */
  variant?: "corners" | "pill";
}

const BACKGROUND_BY_VARIANT: Record<NonNullable<GoldenBorderOverlayProps["variant"]>, string> = {
  corners:
    "conic-gradient(from 30deg, transparent 8%, #DFB968 33%, transparent 47%, transparent 63%, #DFB968 75%, transparent 100%)",
  pill: "linear-gradient(90deg, #DFB968 0%, rgba(223,185,104,0.15) 35%, rgba(223,185,104,0.15) 65%, #DFB968 100%)",
};

export function GoldenBorderOverlay({
  className,
  variant = "corners",
}: GoldenBorderOverlayProps) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 rounded-2xl opacity-70", className)}
      style={{
        padding: "1px",
        background: BACKGROUND_BY_VARIANT[variant],
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
      }}
    />
  );
}
