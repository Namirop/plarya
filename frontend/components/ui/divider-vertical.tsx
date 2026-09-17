import { cn } from "@/lib/utils";

// Trait doré de 1 px estompé aux extrémités, vertical ou horizontal.
const GOLD_FADE_GRADIENT_VERTICAL =
  "linear-gradient(to bottom, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";
const GOLD_FADE_GRADIENT_HORIZONTAL =
  "linear-gradient(to right, rgba(223,185,104,0.2) 0%, rgba(223,185,104,1) 51%, rgba(223,185,104,0.2) 100%)";

export interface DividerVerticalProps {
  /** Longueur du trait en px, quelle que soit l'orientation. */
  height?: number;
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
