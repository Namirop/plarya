import { cn } from "@/lib/utils";

/**
 * Logo à hauteur fixe et largeur libre (ratios très variables), borné par
 * `max-w`. `<img>` plutôt que next/image : SVG locaux et petites images, sans
 * gain notable de l'optimiseur. Sans logo : tuile avec l'initiale.
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
