import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Écran d'état plein écran (404, erreur, résultat de paiement…) : grand titre
// centré, sans carte ni fond.

export interface InfoScreenProps {
  /** Surtitre en capitales (ex. "404"). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Surtitre en doré plutôt qu'en gris. */
  eyebrowAccent?: boolean;
  className?: string;
}

export function InfoScreen({
  eyebrow,
  title,
  subtitle,
  actions,
  eyebrowAccent = false,
  className,
}: InfoScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "font-body text-[12px] font-semibold uppercase tracking-[0.25em]",
            eyebrowAccent ? "text-accent" : "text-muted-foreground",
          )}
        >
          {eyebrow}
        </p>
      )}

      {/* Interligne très serré : les métriques de Hubot Sans sont aérées. */}
      <h1
        style={{ lineHeight: 0.85 }}
        className={cn(
          "max-w-[860px] font-display text-foreground",
          "text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px]",
          eyebrow && "mt-5",
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-6 max-w-[560px] font-body text-body-18 leading-[1.55] text-muted-foreground">
          {subtitle}
        </p>
      )}

      {actions && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{actions}</div>
      )}
    </div>
  );
}
