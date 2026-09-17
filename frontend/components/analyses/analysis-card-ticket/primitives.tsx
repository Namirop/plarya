import type { ReactNode } from "react";

import { Lock } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Contenu verrouillé (flouté par l'appelant) masqué aux technologies
 * d'assistance, sous un cadenas centré sur le contenu ou, avec `fullWidth`,
 * sur toute la largeur.
 */
export function LockedBlock({
  children,
  className,
  fullWidth = false,
}: {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("relative max-w-full", fullWidth ? "w-full" : "w-fit", className)}>
      <div aria-hidden className="pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="size-6 text-foreground" aria-label="Contenu verrouillé" />
      </div>
    </div>
  );
}
