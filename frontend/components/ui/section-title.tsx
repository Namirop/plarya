import type { ReactNode } from "react";

import Link from "next/link";

import { CaretRight } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// Même structure (barre verticale, titre, lien optionnel), deux typographies :
// MarketingSectionTitle (police display, sections de l'accueil) et
// SectionTitle (police de texte en gras, espaces connectés).

export interface SectionTitleCta {
  text: string;
  href: string;
}

export interface SectionTitleProps {
  // ReactNode : le titre peut contenir des fragments stylés.
  title: ReactNode;
  cta?: SectionTitleCta;
  className?: string;
  /** Ex. masquer le lien en mobile quand la section a un bouton équivalent. */
  ctaClassName?: string;
}

// ════════════════ Marketing (homepage) ════════════════

export function MarketingSectionTitle({ title, cta, className, ctaClassName }: SectionTitleProps) {
  return (
    <div className={cn("flex w-full items-center justify-between gap-6", className)}>
      <div className="flex items-center gap-4">
        <span aria-hidden className="block h-[46px] md:h-[54px] w-px shrink-0 bg-accent" />
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
        {/* Barre neutre : le doré est réservé aux titres de l'accueil. */}
        <span
          aria-hidden
          className="block h-[28px] md:h-[32px] w-px shrink-0 bg-foreground"
        />
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
