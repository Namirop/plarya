import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// Card de bénéfice asymétrique pour /devenir-expert §2.
//
// 3 variants pour casser le pattern "3 cards identiques en grille"
// (le pattern AI-template par excellence) :
//
//   - `vertical-large` : layout vertical, icône en haut + texte
//     dessous, fond légèrement plus clair (surface-2). Utilisé pour
//     la card "héro" en col-span-7.
//   - `vertical-compact` : layout vertical mais texte resserré et
//     padding réduit. Card secondaire en col-span-5.
//   - `horizontal-wide` : layout horizontal full-width avec icône à
//     gauche, texte au milieu, tags à droite. Sur 12 colonnes.

export interface BenefitCardProps {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  variant?: "vertical-large" | "vertical-compact" | "horizontal-wide";
  /** Tags optionnels affichés à droite pour la variant `horizontal-wide`. */
  tags?: ReactNode;
  className?: string;
}

export function BenefitCard({
  icon: Icon,
  title,
  description,
  variant = "vertical-large",
  tags,
  className,
}: BenefitCardProps) {
  if (variant === "horizontal-wide") {
    return (
      <div
        className={cn(
          "group flex flex-col items-start gap-6 rounded-2xl border border-surface-3 bg-surface-1 p-7 md:flex-row md:items-center md:gap-8 md:p-8",
          "transition-colors duration-300 hover:border-foreground/20",
          className,
        )}
      >
        <Icon size={40} weight="regular" className="shrink-0 text-foreground/80" />
        <div className="min-w-0 flex-1">
          <h3 className="font-body text-h5 font-bold text-foreground md:text-[20px]">{title}</h3>
          <p className="mt-2 font-body text-body-16 leading-[1.5] text-muted-foreground">
            {description}
          </p>
        </div>
        {tags && (
          <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">{tags}</div>
        )}
      </div>
    );
  }

  // Variants verticales : large (fond surface-2, padding généreux) et
  // compact (fond surface-1, padding plus serré, min-h plus bas).
  const isLarge = variant === "vertical-large";

  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-surface-3",
        isLarge ? "bg-surface-2 p-8 min-h-[280px]" : "bg-surface-1 p-7 min-h-[240px]",
        "transition-colors duration-300 hover:border-foreground/20",
        className,
      )}
    >
      <Icon
        size={isLarge ? 40 : 32}
        weight="regular"
        className="text-foreground/80"
      />
      <h3
        className={cn(
          "mt-5 font-body font-bold text-foreground",
          isLarge ? "text-[22px]" : "text-h5",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-3 font-body leading-[1.5] text-muted-foreground",
          isLarge ? "text-body-16" : "text-body-16",
        )}
      >
        {description}
      </p>
    </div>
  );
}
