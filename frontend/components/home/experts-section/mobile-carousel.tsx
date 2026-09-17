"use client";

import { ExpertCard, type ExpertCardProps } from "@/components/experts/expert-card";
import { cn } from "@/lib/utils";

import { CARD_GAP, useCarouselScroll } from "./use-carousel-scroll";

/** Carrousel mobile : une carte par vue, la suivante dépasse légèrement. */
export function MobileCarousel({ experts }: { experts: (ExpertCardProps & { id: string })[] }) {
  const { scrollerRef, activePage, scrollToPage } = useCarouselScroll({
    gap: CARD_GAP,
    cardsPerPage: 1,
    totalItems: experts.length,
  });

  return (
    <div className="md:hidden mt-6">
      <div
        ref={scrollerRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-1",
          "snap-x snap-mandatory scroll-smooth",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {experts.map((expert) => (
          // 86 % : la carte suivante reste visible et invite au swipe.
          <div key={expert.id} className="shrink-0 snap-start w-[86%] max-w-[322px]">
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

      {experts.length > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {experts.map((expert, i) => (
            <button
              key={expert.id}
              type="button"
              onClick={() => scrollToPage(i)}
              aria-label={`Aller à l'expert ${i + 1}`}
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
