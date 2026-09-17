"use client";

import { useEffect, useRef, useState } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { formDaModalInputCls } from "@/lib/form-da";
import { createCheckoutSession } from "@/lib/stripe";

interface EmailCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  expertId: string;
  type: "DAY_PASS" | "MONTHLY";
}

export function EmailCheckoutModal({ open, onClose, expertId, type }: EmailCheckoutModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Réinitialisation à la fermeture.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setEmail("");
      setError("");
      setLoading(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Escape désactivé entre l'envoi et la redirection vers Stripe.
  const { containerRef } = useModalA11y({
    open,
    onClose,
    disableEscape: loading,
    initialFocusRef: inputRef,
  });

  if (!open) return null;

  // Contrôle minimal ; l'API valide l'email.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Veuillez entrer un email valide");
      return;
    }
    setLoading(true);
    try {
      const url = await createCheckoutSession(expertId, type, trimmed);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-checkout-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-surface-1 p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Fermer"
          className="absolute right-4 top-4 cursor-pointer p-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        <h2
          id="email-checkout-title"
          className="font-body text-[22px] font-bold text-foreground md:text-h4"
        >
          Accédez aux analyses
        </h2>
        <p className="mt-2 font-body text-body-16 text-muted-foreground">
          Entrez votre email pour recevoir l&apos;accès et votre facture
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <label htmlFor="checkout-email" className="sr-only">
            Adresse email
          </label>
          <input
            ref={inputRef}
            id="checkout-email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={formDaModalInputCls}
            disabled={loading}
          />
          {error && (
            <p role="alert" className="font-body text-body-16 text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full whitespace-normal px-4 text-body-16 sm:px-8 sm:text-h5"
          >
            {loading ? (
              <span className="inline-flex items-center gap-3">
                <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Redirection vers le paiement…
              </span>
            ) : (
              "Continuer vers le paiement"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
