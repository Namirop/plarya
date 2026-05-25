import type { ReactNode } from "react";

import Link from "next/link";

import { CaretRight } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// ════════════════════════════════════════════════════════════════════
// Deux composants distincts par RÈGLE D'USAGE TYPO (cf. CLAUDE.md §3) :
//
//  - <MarketingSectionTitle> : font-display (DM Serif Display) — réservé
//    aux sections marketing de la homepage (Domaines, Experts, Pourquoi
//    Plarya, Devenir créateur). Effet éditorial / "presse".
//
//  - <SectionTitle> : font-body (Work Sans) bold — UI interne (dashboard,
//    admin, compte, etc.). Hiérarchie portée par la taille + le weight,
//    pas par le changement de famille.
//
// Le pattern visuel commun (gold-bar prefix + optional CTA right) reste
// identique entre les deux, seule la typo change.
// ════════════════════════════════════════════════════════════════════

export interface SectionTitleCta {
  text: string;
  href: string;
}

export interface SectionTitleProps {
  // ReactNode (et pas juste string) pour permettre des titres avec
  // fragments stylés — ex. "Pourquoi Plarya <span class="text-accent">?</span>".
  title: ReactNode;
  cta?: SectionTitleCta;
  className?: string;
  /** Classes appliquées au lien CTA. Sert notamment à le masquer en mobile
   *  quand la section a un bouton équivalent en bas (ex: section Experts). */
  ctaClassName?: string;
}

// ════════════════ Marketing (homepage) ════════════════

export function MarketingSectionTitle({ title, cta, className, ctaClassName }: SectionTitleProps) {
  return (
    <div className={cn("flex w-full items-center justify-between gap-6", className)}>
      <div className="flex items-center gap-4">
        <span aria-hidden className="block h-[46px] md:h-[54px] w-px shrink-0 bg-accent" />
        {/* text-[28px] mobile : bumpé vs Figma "H2 mobile" (24/24) — donne
            plus de présence aux titres en mobile sans empiéter sur le
            desktop. md:text-h2 = 32/1 desktop (inchangé). Pas de token
            Tailwind dédié pour le mobile : v4 ne génère pas les utilities
            avec suffixe ambigu. */}
        <h2 className="font-display text-[28px] leading-none md:text-h2 text-foreground">
          {title}
        </h2>
      </div>

      {cta && <SectionCta cta={cta} className={ctaClassName} />}
    </div>
  );
}

// ════════════════ Interne (dashboard, admin, compte…) ════════════════

export function SectionTitle({ title, cta, className, ctaClassName }: SectionTitleProps) {
  return (
    <div className={cn("flex w-full items-center justify-between gap-6", className)}>
      <div className="flex items-center gap-4">
        {/* Bar prefix neutre — anciennement bg-accent (doré), mis en
            neutre en 3B (règle /dashboard /admin /compte : titres
            internes sans doré). Le doré reste pour MarketingSectionTitle. */}
        <span
          aria-hidden
          className="block h-[28px] md:h-[32px] w-px shrink-0 bg-foreground"
        />
        {/* Work Sans bold (700) — pas de font-display ici. Le contraste
            vient de la taille (24px mobile, 28px desktop) + du weight
            bold + de la bar prefix. */}
        <h2 className="font-body font-bold text-[22px] leading-none md:text-[28px] text-foreground">
          {title}
        </h2>
      </div>

      {cta && <SectionCta cta={cta} className={ctaClassName} />}
    </div>
  );
}

// ════════════════ CTA partagé ════════════════

function SectionCta({ cta, className }: { cta: SectionTitleCta; className?: string }) {
  return (
    <Link
      href={cta.href}
      className={cn(
        "group inline-flex items-center gap-2 font-body text-body-18 text-foreground transition-opacity hover:opacity-80",
        className,
      )}
    >
      {cta.text}
      <CaretRight
        className="size-4 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
