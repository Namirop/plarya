import { cn } from "@/lib/utils";

// Mini-bloc "stat fort" — pattern type-driven : un GROS chiffre + label
// court + petite description. Pas de border, pas de bg — la stat
// porte tout seule. Utilisé sur /devenir-expert et /dashboard (stats
// expert).
//
// Desktop : grid de 3 cols égales avec divider vertical subtle entre
// les blocs (`withLeftDivider` sur les blocs 2 et 3). Mobile : stack
// vertical sans divider.

export interface StatBlockProps {
  value: string;
  label: string;
  description: string;
  /** Quand true, le gros chiffre est en doré (réservé à 1 bloc max
   *  par grille pour conserver l'effet d'accent). */
  valueAccent?: boolean;
  /** Border-left desktop only — séparateur vertical entre blocs. */
  withLeftDivider?: boolean;
  /** Variante compacte : gabarit typo + padding réduits. Utilisée
   *  pour le Dashboard expert où la stat est secondaire au H1
   *  pseudo placé au-dessus (vs Devenir Expert où la stat est le
   *  hero de la section). */
  compact?: boolean;
  className?: string;
}

export function StatBlock({
  value,
  label,
  description,
  valueAccent = false,
  withLeftDivider = false,
  compact = false,
  className,
}: StatBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        // Padding : compact réduit le gabarit vertical (~50 %) + mobile
        // encore plus serré (py-3) pour répondre à la demande "colle
        // verticalement" sur la version mobile du Dashboard.
        compact ? "px-2 py-3 md:px-6 md:py-6" : "px-2 py-10 md:px-8 md:py-12",
        withLeftDivider && "md:border-l md:border-surface-2",
        className,
      )}
    >
      <p
        className={cn(
          "font-display font-bold leading-[0.95] tabular-nums",
          compact
            ? "text-[36px] md:text-[48px]"
            : "text-[56px] md:text-[72px]",
          valueAccent ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-2 font-body text-muted-foreground",
          compact ? "text-body-16" : "mt-3 text-body-18",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-body leading-[1.5] text-muted-foreground/70",
          compact ? "text-[13px]" : "mt-2 text-body-14",
        )}
      >
        {description}
      </p>
    </div>
  );
}
