import { cn } from "@/lib/utils";

// Trait 1px de large (vertical) ou 1px de haut (horizontal), longueur
// paramétrable, avec un gradient doré qui s'estompe aux deux extrémités
// + opacity 60%. Utilisé entre les items du Trust row du Hero
// (height=96), entre les piliers de la section "Pourquoi Plarya"
// (desktop : vertical 192px, mobile : horizontal 192px).
const GOLD_FADE_GRADIENT_VERTICAL =
  "linear-gradient(to bottom, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";
const GOLD_FADE_GRADIENT_HORIZONTAL =
  "linear-gradient(to right, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";

export interface DividerVerticalProps {
  /** Longueur du trait en px (hauteur si vertical, largeur si horizontal). */
  height?: number;
  /** Orientation du trait. Default vertical (rétro-compat avec usages existants). */
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function DividerVertical({
  height = 96,
  orientation = "vertical",
  className,
}: DividerVerticalProps) {
  const isHorizontal = orientation === "horizontal";
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 opacity-60", className)}
      style={
        isHorizontal
          ? {
              width: height,
              height: 1,
              background: GOLD_FADE_GRADIENT_HORIZONTAL,
            }
          : {
              width: 1,
              height,
              background: GOLD_FADE_GRADIENT_VERTICAL,
            }
      }
    />
  );
}
