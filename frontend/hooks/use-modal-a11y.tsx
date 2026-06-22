"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), iframe, object, embed, ' +
  '[tabindex]:not([tabindex="-1"]), [contenteditable]';

interface UseModalA11yOptions {
  /** La modale est-elle ouverte ? */
  open: boolean;
  /** Callback déclenché à l'appui Escape (ou cliquer hors modale, géré par le caller). */
  onClose: () => void;
  /** Si true, Escape est ignoré (typiquement pendant une soumission async). */
  disableEscape?: boolean;
  /**
   * Élément à focuser à l'ouverture. Par défaut : le premier focusable
   * dans le container. Passer une ref pour cibler explicitement (input
   * email, etc.).
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

interface UseModalA11yResult {
  /** Ref à passer sur le container du dialog (pour focus trap + initial focus). */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Hook qui regroupe les comportements a11y d'une modale :
 *  1. Scroll-lock du body pendant l'ouverture
 *  2. Escape pour fermer (optionnel via disableEscape)
 *  3. Focus initial à l'ouverture (50 ms timer pour laisser le screen
 *     reader annoncer le dialog avant de voler le focus)
 *  4. Focus trap (Tab / Shift+Tab cyclent dans le container)
 *  5. Restauration du focus sur l'élément trigger à la fermeture
 *
 * Le caller reste responsable de :
 *  - Rendre le markup avec role="dialog" aria-modal aria-labelledby
 *  - Gérer le clic sur l'overlay (généralement onClick={onClose})
 *  - Désactiver onClose pendant les actions async (passer disableEscape
 *    + désactiver onClick overlay côté caller)
 */
export function useModalA11y({
  open,
  onClose,
  disableEscape = false,
  initialFocusRef,
}: UseModalA11yOptions): UseModalA11yResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 1. Scroll-lock body + 5. Memoize element to restore focus on close
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      // Restaure le focus sur l'élément qui a déclenché l'ouverture
      // (pattern WAI-ARIA dialog). Si l'élément a été démonté entre-temps,
      // .focus() est no-op silencieux.
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // 3. Focus initial à l'ouverture (timer 50 ms pour annonce screen reader)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      // Fallback : premier focusable du container
      const root = containerRef.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open, initialFocusRef]);

  // 2. Escape + 4. Focus trap (un seul listener pour les 2)
  useEffect(() => {
    if (!open) return;
    const root = containerRef.current;
    if (!root) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (disableEscape) return;
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null); // visible only

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, disableEscape]);

  return { containerRef };
}
