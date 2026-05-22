"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  /** Email exact requis pour confirmer la suppression (anti-erreur). */
  userEmail: string;
  /** Appelé une fois que l'user a tapé son email et confirmé. */
  onConfirm: () => Promise<void>;
}

export function DeleteAccountModal({
  open,
  onClose,
  userEmail,
  onConfirm,
}: DeleteAccountModalProps) {
  const [typedEmail, setTypedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset des states quand la modale se ferme. Pattern setState dans
  // useEffect en réponse à un changement de prop (open : true → false)
  // — légitime ici (pas de cascade de renders puisqu'on agit
  // uniquement sur un edge déterministe).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setTypedEmail("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll-lock body pendant que la modale est ouverte.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape pour fermer (pattern partagé avec les autres modales DS).
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const emailMatches = typedEmail.trim().toLowerCase() === userEmail.toLowerCase();

  async function handleConfirm() {
    if (!emailMatches || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
      // onConfirm gère la redirection/close — pas de setSubmitting(false)
      // ici, le composant sera démonté.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={submitting ? undefined : onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-destructive/40 bg-background p-8"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Fermer la modale"
          className="absolute right-4 top-4 cursor-pointer p-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        <h2
          id="delete-account-title"
          className="font-display text-h4 text-destructive"
        >
          Supprimer ton compte ?
        </h2>
        <p className="mt-3 font-body text-body-16 text-muted-foreground">
          Cette action est <strong className="text-foreground">irréversible</strong>.
          Tape ton email{" "}
          <span className="text-foreground">({userEmail})</span> pour
          confirmer.
        </p>

        <div className="mt-6 space-y-2">
          <label
            htmlFor="delete-confirm-email"
            className="font-body text-body-16 text-muted-foreground"
          >
            Email
          </label>
          <input
            id="delete-confirm-email"
            type="email"
            placeholder={userEmail}
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            autoComplete="off"
            disabled={submitting}
            className={fieldCls}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 font-body text-body-16 text-destructive"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={!emailMatches || submitting}
            className="flex-1 !bg-destructive !border-destructive hover:!brightness-110"
          >
            {submitting ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
