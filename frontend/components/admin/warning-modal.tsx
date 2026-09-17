"use client";

import { useEffect, useRef, useState } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { fieldClsCompact } from "@/lib/admin-styles";
import { cn } from "@/lib/utils";

export interface WarningModalProps {
  open: boolean;
  expertPseudo: string;
  /** Avertissement actuel, vide si aucun. */
  initialValue: string;
  onClose: () => void;
  /** Message vide = avertissement retiré. En cas de rejet, la modale reste ouverte. */
  onSave: (message: string) => Promise<void> | void;
}

/** Saisie de l'avertissement affiché sur le profil public d'un expert (admin). */
export function WarningModal({
  open,
  expertPseudo,
  initialValue,
  onClose,
  onSave,
}: WarningModalProps) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Réinitialisé à chaque ouverture : l'expert ciblé peut changer.
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSave() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(value.trim());
      // En cas de succès, l'appelant ferme la modale.
    } catch {
      // L'appelant affiche l'erreur ; la modale reste ouverte.
    } finally {
      setSubmitting(false);
    }
  }

  const { containerRef } = useModalA11y({
    open,
    onClose: handleClose,
    initialFocusRef: textareaRef,
  });

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
        aria-labelledby="warning-modal-title"
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
          id="warning-modal-title"
          className="font-body text-[22px] font-bold text-foreground md:text-h4"
        >
          Avertissement — {expertPseudo}
        </h2>

        <p className="mt-3 font-body text-body-16 text-muted-foreground">
          Ce message s&apos;affiche sur le profil public de l&apos;expert. Laissez le champ vide
          pour retirer l&apos;avertissement.
        </p>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`Message d'avertissement pour ${expertPseudo}`}
          rows={4}
          placeholder="Message d'avertissement…"
          className={cn(fieldClsCompact, "mt-4 resize-y")}
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                Enregistrement…
              </span>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
