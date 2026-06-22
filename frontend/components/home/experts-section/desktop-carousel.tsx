"use client";

import { ArrowRight } from "@phosphor-icons/react";

import { ExpertCard, type ExpertCardProps } from "@/components/experts/expert-card";
import { cn } from "@/lib/utils";

import { CARD_GAP, CARD_WIDTH, CARDS_PER_PAGE, useCarouselScroll } from "./use-carousel-scroll";

/** Carrousel desktop : pages de 3 cards + flèche next + dots. */
export function DesktopCarousel({ experts }: { experts: (ExpertCardProps & { id: string })[] }) {
  const { scrollerRef, activePage, isAtEnd, scrollToPage, totalPages } = useCarouselScroll({
    gap: CARD_GAP,
    cardsPerPage: CARDS_PER_PAGE,
    totalItems: experts.length,
  });

  function handleNext() {
    if (isAtEnd) return;
    scrollToPage(activePage + 1);
  }

  return (
    <div className="hidden md:block relative mt-10">
      <div
        ref={scrollerRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-2",
          "snap-x snap-mandatory scroll-smooth",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {experts.map((expert) => (
          <div key={expert.id} className="shrink-0 snap-start" style={{ width: CARD_WIDTH }}>
            <ExpertCard
              id={expert.id}
              avatar={expert.avatar}
              pseudo={expert.pseudo}
              viewsCount={expert.viewsCount}
              categories={expert.categories}
              analyses={expert.analyses}
              locked={expert.locked}
            />
          </div>
        ))}
      </div>

      {/* Next button — overlay top-right, vertical-centré sur les cards.
          Masqué quand tout tient déjà (1 page). */}
      {totalPages > 1 && (
        <button
          type="button"
          onClick={handleNext}
          disabled={isAtEnd}
          aria-label="Voir les experts suivants"
          className={cn(
            "absolute top-[188px] right-[-22px] flex size-[45px] items-center justify-center rounded-full",
            "border border-surface-elevated bg-background text-foreground",
            "transition-all duration-200 ease-out cursor-pointer",
            "hover:bg-white/[0.04] hover:border-foreground/30",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none disabled:hover:shadow-none",
          )}
        >
          <ArrowRight className="size-5" strokeWidth={1.5} />
        </button>
      )}

      {/* Dots — centrés, sous les cards. Affichés s'il y a > 1 page. */}
      {totalPages > 1 && (
        <div className="flex mt-[27px] justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToPage(i)}
              aria-label={`Aller à la page ${i + 1}`}
              className={cn(
                "size-[10px] rounded-full transition-all duration-200 cursor-pointer",
                i === activePage ? "bg-foreground" : "bg-muted-foreground opacity-40 hover:opacity-70",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
