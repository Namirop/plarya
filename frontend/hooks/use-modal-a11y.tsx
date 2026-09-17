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
 * Comportements d'accessibilité d'une modale : blocage du scroll, Escape,
 * focus initial (après 50 ms, le temps que le lecteur d'écran annonce le
 * dialogue), piège à focus et restauration du focus à la fermeture.
 * L'appelant fournit le markup `role="dialog"` et gère le clic sur l'overlay.
 */
export function useModalA11y({
  open,
  onClose,
  disableEscape = false,
  initialFocusRef,
}: UseModalA11yOptions): UseModalA11yResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Blocage du scroll et mémorisation de l'élément à refocaliser.
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      // Sans effet si l'élément a été démonté entre-temps.
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const root = containerRef.current;
      if (!root) return;
      const first = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open, initialFocusRef]);

  // Escape et piège à focus (Tab / Shift+Tab).
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
      ).filter((el) => el.offsetParent !== null); // éléments visibles

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
