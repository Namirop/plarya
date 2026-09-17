import { cn } from "@/lib/utils";

// Liseré doré qui s'estompe hors des coins haut-gauche et bas-droite.
// Le trait est une vraie bordure CSS (nette à tout zoom) ; le masque conique
// ne module que son opacité le long du périmètre. Créer l'anneau par masque
// (mask-composite) donnerait un trait pâle et irrégulier (anticrénelage).
// Parent en `relative` ; reprendre son rayon via `className`. Réglé pour des
// cartes en format paysage.
const FADE_MASK =
  "conic-gradient(from 30deg, transparent 8%, #000 33%, transparent 47%, transparent 63%, #000 75%, transparent 100%)";

export interface GoldenBorderOverlayProps {
  /** Typiquement `rounded-*`, identique au parent. */
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
