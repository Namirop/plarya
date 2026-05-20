import { cn } from "@/lib/utils";

// Trait vertical 1px de large, hauteur paramétrable, avec un gradient
// doré qui s'estompe aux deux extrémités + opacity 60%. Utilisé entre
// les items du Trust row du Hero (height=96) et entre les piliers de
// la section "Pourquoi Plarya" (height=192).
const GOLD_FADE_GRADIENT =
  "linear-gradient(to bottom, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";

export interface DividerVerticalProps {
  /** Hauteur en px. Hero Trust row : 96. Pourquoi Plarya piliers : 192. */
  height?: number;
  className?: string;
}

export function DividerVertical({
  height = 96,
  className,
}: DividerVerticalProps) {
  return (
    <span
      aria-hidden
      className={cn("block w-px shrink-0 opacity-60", className)}
      style={{ height, background: GOLD_FADE_GRADIENT }}
    />
  );
}
