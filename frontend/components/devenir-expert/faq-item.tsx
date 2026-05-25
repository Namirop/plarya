"use client";

import { useId, useState, type ReactNode } from "react";

import { CaretDown } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// Item d'accordéon FAQ. État local (open/closed) ; le parent rend
// plusieurs FaqItem sans coordination — chaque question gère son
// propre toggle. Si on veut un comportement "un seul ouvert à la
// fois", le parent pourra lifter le state via une prop contrôlée.
//
// Animation : CSS grid-template-rows 0fr → 1fr pour faire un slide
// fluide sans connaître la hauteur exacte du contenu à l'avance.
// Pattern moderne (CSS Grid > scroll-height JS). Fallback prefers-
// reduced-motion via `motion-safe:` Tailwind.

export interface FaqItemProps {
  question: string;
  answer: ReactNode;
  /** Ouvert par défaut au mount (utile pour rendre la 1re question
   *  ouverte si on veut éviter qu'aucune ne soit visible au load). */
  defaultOpen?: boolean;
}

export function FaqItem({ question, answer, defaultOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="rounded-xl border border-surface-3 bg-surface-1 transition-colors duration-200 hover:border-foreground/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left md:px-6 md:py-6"
      >
        <span className="font-body text-body-16 font-semibold text-foreground md:text-body-18">
          {question}
        </span>
        <CaretDown
          size={18}
          weight="bold"
          className={cn(
            // Caret neutre — anciennement doré, retiré au 3B
            // (4 carets dorés alignés = saturation, le state open/closed
            // est porté par la rotation, pas la couleur).
            "shrink-0 text-muted-foreground transition-transform duration-300 ease-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {/* Container animé via grid-template-rows 0fr → 1fr. L'enfant
          intérieur a overflow:hidden + min-h:0 pour que le clip
          fonctionne dans une grid row. Smooth, pas de saut. */}
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 font-body text-body-16 leading-[1.6] text-muted-foreground md:px-6 md:pb-6">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}
