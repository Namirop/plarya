"use client";

import { useState, type ReactNode } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { cn } from "@/lib/utils";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  /** Peut être async : la modale ne se ferme qu'une fois la promesse résolue. */
  onConfirm: () => Promise<void> | void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" : bouton de confirmation destructif. */
  variant?: "default" | "danger";
}

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

  function handleClose() {
    // Pas de fermeture pendant l'exécution de l'action.
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
      // L'appelant affiche l'erreur ; la modale reste ouverte pour réessayer.
    } finally {
      setSubmitting(false);
    }
  }

  const { containerRef } = useModalA11y({ open, onClose: handleClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-surface-elevated bg-surface-1 p-6 sm:p-8"
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

        <h2
          id="confirm-modal-title"
          className="font-body text-[22px] font-bold text-foreground md:text-h4"
        >
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
