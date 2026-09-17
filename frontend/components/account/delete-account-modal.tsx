"use client";

import { useEffect, useRef, useState } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { formDaModalInputCls } from "@/lib/form-da";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  /** À ressaisir pour confirmer. */
  userEmail: string;
  onConfirm: () => Promise<void>;
  /** `scheduled` : expert avec abonnés actifs, suppression différée et annulable. */
  mode?: "immediate" | "scheduled";
  /** Date ISO de prise d'effet (mode scheduled). */
  lastSubExpiresAt?: string | null;
  activeSubscriptions?: number;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function DeleteAccountModal({
  open,
  onClose,
  userEmail,
  onConfirm,
  mode = "immediate",
  lastSubExpiresAt = null,
  activeSubscriptions = 0,
}: DeleteAccountModalProps) {
  const [typedEmail, setTypedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Réinitialisation à la fermeture.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setTypedEmail("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { containerRef } = useModalA11y({
    open,
    onClose,
    disableEscape: submitting,
    initialFocusRef: inputRef,
  });

  if (!open) return null;

  const emailMatches = typedEmail.trim().toLowerCase() === userEmail.toLowerCase();

  async function handleConfirm() {
    if (!emailMatches || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm();
      // onConfirm ferme ou redirige : pas de setSubmitting(false) ici.
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
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-surface-1 p-6 sm:p-8"
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
          className="font-body text-[22px] font-bold text-foreground md:text-h4"
        >
          {mode === "scheduled" ? "Programmer la suppression ?" : "Supprimer ton compte ?"}
        </h2>
        {mode === "scheduled" ? (
          <p className="mt-3 font-body text-body-16 leading-[1.5] text-muted-foreground">
            Tu as{" "}
            <strong className="font-semibold text-foreground">
              {activeSubscriptions} abonné{activeSubscriptions > 1 ? "s" : ""}
            </strong>{" "}
            actif{activeSubscriptions > 1 ? "s" : ""}. Ton profil sera retiré des listings publics
            et n&apos;acceptera plus de nouveaux abonnés. La suppression deviendra effective le{" "}
            <strong className="font-semibold text-foreground">
              {formatDate(lastSubExpiresAt)}
            </strong>
            . Tu peux annuler à tout moment d&apos;ici là.
            <br />
            <br />
            Tape ton email (
            <span className="font-mono font-semibold text-foreground">{userEmail}</span>) pour
            confirmer.
          </p>
        ) : (
          <p className="mt-3 font-body text-body-16 leading-[1.5] text-muted-foreground">
            Cette action est <strong className="font-semibold text-foreground">irréversible</strong>
            . Tape ton email (
            <span className="font-mono font-semibold text-foreground">{userEmail}</span>) pour
            confirmer.
          </p>
        )}

        <div className="mt-6 space-y-2">
          <label
            htmlFor="delete-confirm-email"
            className="block font-body text-body-16 font-medium text-foreground"
          >
            Email
          </label>
          <input
            ref={inputRef}
            id="delete-confirm-email"
            type="email"
            placeholder={userEmail}
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            autoComplete="off"
            disabled={submitting}
            className={formDaModalInputCls}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 font-body text-body-16 text-destructive">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border-surface-elevated text-foreground hover:border-surface-elevated hover:bg-white/[0.04]"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={handleConfirm}
            disabled={!emailMatches || submitting}
            className="flex-1"
          >
            {submitting
              ? mode === "scheduled"
                ? "Programmation…"
                : "Suppression…"
              : mode === "scheduled"
                ? "Programmer la suppression"
                : "Supprimer définitivement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
