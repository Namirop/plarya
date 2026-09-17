import { cn } from "@/lib/utils";

// Statistique mise en avant : grand chiffre, libellé et description.

export interface StatBlockProps {
  value: string;
  label: string;
  description: string;
  /** Chiffre en doré (un seul bloc par grille). */
  valueAccent?: boolean;
  /** Séparateur vertical à gauche, en desktop uniquement. */
  withLeftDivider?: boolean;
  /** Gabarit réduit, quand la statistique est secondaire. */
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
        compact ? "px-2 py-3 md:px-6 md:py-6" : "px-2 py-10 md:px-8 md:py-12",
        withLeftDivider && "md:border-l md:border-surface-2",
        className,
      )}
    >
      <p
        className={cn(
          "font-display font-bold leading-[0.95] tabular-nums",
          compact ? "text-[36px] md:text-[48px]" : "text-[56px] md:text-[72px]",
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
