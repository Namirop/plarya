"use client";

import { useEffect, useRef, useState } from "react";

import { X } from "@phosphor-icons/react";

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
  /**
   * `immediate` → suppression directe (USER lambda OU EXPERT sans sub
   * active). Le texte explique que c'est irréversible.
   * `scheduled` → EXPERT avec subs actives. Le texte explique que la
   * suppression sera programmée (pendingDeletionAt) et annulable
   * jusqu'à l'expiration de la dernière sub.
   */
  mode?: "immediate" | "scheduled";
  /** ISO date — date à laquelle la suppression deviendra effective (mode scheduled). */
  lastSubExpiresAt?: string | null;
  /** Nombre de subs actives bloquantes (mode scheduled). */
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
      {/* Cadre : bordure neutre `surface-elevated` (= autres modales du DS,
          ConfirmModal, LoginModal). Le rouge alarmant a été retiré du
          cadre — il ne subsiste que sur le bouton de confirmation, le
          vrai point focal de l'action. */}
      <div
        ref={dialogRef}
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

        {/* Titre : Work Sans bold blanc (pas rouge — le rouge se mérite
            sur l'action, pas sur le titre). */}
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
            Cette action est{" "}
            <strong className="font-semibold text-foreground">irréversible</strong>. Tape ton email
            (<span className="font-mono font-semibold text-foreground">{userEmail}</span>) pour
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
          <p role="alert" className="mt-4 font-body text-body-16 text-destructive">
            {error}
          </p>
        )}

        {/* Boutons : size `md` (= compact mais lisible, ≈44px de haut),
            même hauteur sur les 2 → harmonisation. flex-1 + gap-3 :
            les 2 boutons partagent la largeur disponible à parts égales
            sur desktop (rangée), full-width stack sur mobile. */}
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
