"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

// Mesures DS : card desktop 322 px + gap 16 px → step 338 px. On scroll
// le carrousel desktop par pages de 3 cards.
export const CARD_WIDTH = 322;
export const CARD_GAP = 16;
export const CARDS_PER_PAGE = 3;

/**
 * Tracking du scroll d'un carrousel horizontal (snap). Factorise la
 * logique commune aux carrousels desktop (3 cards/page, largeur fixe)
 * et mobile (1 card/vue, largeur variable 86%).
 *
 * Le "step" est MESURÉ depuis le DOM (offsetWidth du 1er enfant + gap)
 * plutôt que pris en paramètre fixe → fonctionne aussi bien pour les
 * cards à largeur fixe que variable.
 */
export function useCarouselScroll({
  gap,
  cardsPerPage,
  totalItems,
}: {
  gap: number;
  cardsPerPage: number;
  totalItems: number;
}): {
  scrollerRef: RefObject<HTMLDivElement | null>;
  activePage: number;
  isAtEnd: boolean;
  scrollToPage: (page: number) => void;
  totalPages: number;
} {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Minimum 1 pour éviter un render à 0 dots quand la liste est encore
  // vide (fetch initial).
  const totalPages = Math.max(1, Math.ceil(totalItems / cardsPerPage));

  const measureStep = useCallback(() => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + gap : el?.clientWidth || 1;
  }, [gap]);

  const updateState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const pageWidth = measureStep() * cardsPerPage;
    const page = pageWidth > 0 ? Math.round(scrollLeft / pageWidth) : 0;
    setActivePage(Math.min(page, totalPages - 1));
    // Marge de 2 px pour absorber le subpixel rounding du scroll-snap.
    setIsAtEnd(scrollLeft >= maxScroll - 2);
  }, [measureStep, cardsPerPage, totalPages]);

  const scrollToPage = useCallback(
    (page: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: page * measureStep() * cardsPerPage, behavior: "smooth" });
    },
    [measureStep, cardsPerPage],
  );

  // Listener scroll natif (passif).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateState, { passive: true });
    return () => el.removeEventListener("scroll", updateState);
  }, [updateState]);

  // Recompute quand le contenu change (fetch API). useLayoutEffect :
  // on mesure le DOM avant le paint → pas de flash "flèche disabled".
  useLayoutEffect(() => {
    if (totalItems === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateState();
  }, [updateState, totalItems]);

  return { scrollerRef, activePage, isAtEnd, scrollToPage, totalPages };
}
