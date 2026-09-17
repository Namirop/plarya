"use client";

import { useId, useState, type ReactNode } from "react";

import { CaretDown } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// Question de FAQ dépliable, indépendante des autres. L'ouverture anime
// grid-template-rows (0fr → 1fr), sans mesurer la hauteur du contenu.

export interface FaqItemProps {
  question: string;
  answer: ReactNode;
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
            "shrink-0 text-muted-foreground transition-transform duration-300 ease-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {/* L'enfant en overflow-hidden masque le contenu quand la ligne vaut 0fr. */}
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
