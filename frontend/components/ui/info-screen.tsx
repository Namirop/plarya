import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Écran d'information centré XL — utilisé pour les pages d'état
// (404, "déjà expert", checkout success / cancel, etc.).
//
// Pattern :
//  - Container full-height (~80vh) centré verticalement + horizontalement
//  - Eyebrow optionnel en uppercase muted (kicker au-dessus du titre)
//  - H1 XL en font-display, gros gabarit (mobile 56px → desktop 96px),
//    line-height serré pour un effet éditorial
//  - Sous-titre optionnel en body muted
//  - Actions optionnelles (typiquement 1 ou 2 boutons / liens)
//
// Volontairement SANS card / SANS border / SANS bg : c'est le contraire
// d'un message d'erreur "framé" — l'effet recherché est un grand titre
// posé sur le fond noir, simple et direct.

export interface InfoScreenProps {
  /** Petit kicker uppercase au-dessus du titre (ex. "Bienvenue",
   *  "404", "Paiement annulé"). Optionnel. */
  eyebrow?: string;
  /** Titre principal — gros gabarit éditorial. */
  title: string;
  /** Sous-titre optionnel sous le H1. */
  subtitle?: string;
  /** Actions optionnelles (boutons / liens) sous le sous-titre. */
  actions?: ReactNode;
  /** Couleur de l'eyebrow et accent visuel — utile pour le 404 où
   *  on veut un kicker doré. Default neutre (muted). */
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

      {/* H1 XL — font-display (Hubot Sans), line-height ultra-serré
          pour resserrer visuellement les lignes quand le titre wrap
          sur 2+ lignes (mobile ou titres longs). Hubot Sans a des
          métriques internes très aérées, il faut pousser bas pour
          que les lignes se touchent.
          line-height en INLINE STYLE (priorité max) — précédent essai
          via `leading-[0.82]` ne se voyait pas (cache Tailwind /
          Turbopack ou collision de spécificité). L'inline style
          bypasse tous ces cas. */}
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
