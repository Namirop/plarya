import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

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

export function SectionTitle({ title, cta, className, ctaClassName }: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="block h-[46px] md:h-[54px] w-px shrink-0 bg-accent"
        />
        {/* text-[24px] leading-none mobile (= "H2 mobile" du Figma 24/24).
            md:text-h2 = 32/1 desktop. Pas de token Tailwind dédié pour le
            mobile : v4 ne génère pas les utilities avec suffixe ambigu. */}
        <h2 className="font-display text-[24px] leading-none md:text-h2 text-foreground">
          {title}
        </h2>
      </div>

      {cta && (
        <Link
          href={cta.href}
          className={cn(
            "group inline-flex items-center gap-2 font-body text-body-18 text-foreground transition-opacity hover:opacity-80",
            ctaClassName,
          )}
        >
          {cta.text}
          <ChevronRight
            className="size-4 text-accent transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
