"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

// Carrousel desktop : cartes de 322 px espacées de 16 px, par pages de 3.
export const CARD_WIDTH = 322;
export const CARD_GAP = 16;
export const CARDS_PER_PAGE = 3;

/**
 * Suivi de la page active d'un carrousel horizontal. Le pas est mesuré dans
 * le DOM (largeur du premier enfant + gap) : cartes à largeur fixe ou variable.
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
    // Tolérance de 2 px pour les arrondis sous-pixel du scroll-snap.
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

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateState, { passive: true });
    return () => el.removeEventListener("scroll", updateState);
  }, [updateState]);

  // Mesure avant l'affichage quand la liste change : pas d'état transitoire visible.
  useLayoutEffect(() => {
    if (totalItems === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateState();
  }, [updateState, totalItems]);

  return { scrollerRef, activePage, isAtEnd, scrollToPage, totalPages };
}
