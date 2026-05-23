"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  /** Action exécutée si l'utilisateur confirme. Peut être async — le
   *  bouton "Confirmer" affiche un spinner pendant l'await et la
   *  modale ne se ferme qu'après. */
  onConfirm: () => Promise<void> | void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Si "danger", le bouton Confirmer bascule en variant destructive
   *  (rouge). Sinon variant primary doré. */
  variant?: "default" | "danger";
}

// Sélecteur des éléments focusables pour le focus trap. Aligné avec
// LoginModal pour cohérence du pattern modal DS.
const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  function handleClose() {
    // Si une action est en cours, on bloque la fermeture (sinon on
    // perdrait le feedback "Confirmer" en cours d'exécution).
    if (submitting) return;
    onClose();
  }

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // L'appelant gère ses erreurs dans onConfirm. Si une exception
      // remonte, on laisse la modale ouverte pour que l'admin
      // recommence. Le feedback erreur lui-même viendra du Bloc 3
      // (toast global).
    } finally {
      setSubmitting(false);
    }
  }

  // ── Scroll lock body (cohérent LoginModal / EmailCheckoutModal) ──
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Focus trap + Escape ──
  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;

      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay — bg-black/80 + blur, click = handleClose (sauf si
          submitting). Pattern Bloc 2 cohérent avec les autres modales. */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-surface-elevated bg-background p-8"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer la modale"
          disabled={submitting}
          className="absolute right-4 top-4 cursor-pointer p-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        <h2 id="confirm-modal-title" className="font-display text-h4 text-foreground">
          {title}
        </h2>

        <div className="mt-3 font-body text-body-16 text-muted-foreground">{description}</div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "destructive" : "primary"}
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            className={cn(variant === "danger" && "border border-destructive/40")}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                Confirmation…
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
