import { cn } from "@/lib/utils";

/**
 * Logo bookmaker partagé par les deux directions de card (ticket 24px,
 * fiche 20px). Les vrais logos ont des ratios très variables (Winamax
 * quasi-carré, Betclic/PMU en bandeau large) — on fixe la HAUTEUR et on
 * laisse la largeur s'adapter (`w-auto`), borné par `max-w` pour ne pas
 * déborder la colonne. `<img>` plain (pas next/image) : gère SVG locaux
 * + raster distants sans la friction de l'optimiseur sur les SVG, et le
 * gain d'optim est négligeable sur des logos de cette taille.
 *
 * Fallback (logoUrl absent) : tuile carrée avec l'initiale.
 */
export function BookmakerLogo({
  name,
  logoUrl,
  heightClass = "h-6",
  maxWidthClass = "max-w-[84px]",
}: {
  name: string;
  logoUrl: string | null;
  heightClass?: string;
  maxWidthClass?: string;
}) {
  if (!logoUrl) {
    return (
      <span
        className={cn(
          "flex aspect-square shrink-0 items-center justify-center rounded bg-white/[0.06] font-body text-sm text-foreground",
          heightClass,
        )}
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      className={cn("w-auto shrink-0 object-contain", heightClass, maxWidthClass)}
    />
  );
}
