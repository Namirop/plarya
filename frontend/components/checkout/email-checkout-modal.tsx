"use client";

import { useEffect, useRef, useState } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface EmailCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  expertId: string;
  type: "DAY_PASS" | "MONTHLY";
}

// Styles input alignés avec /devenir-expert et le Dashboard pour
// cohérence visuelle des champs DS (fond noir 40 %, bordure subtile,
// focus accent doré).
const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

export function EmailCheckoutModal({ open, onClose, expertId, type }: EmailCheckoutModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset des states à la fermeture. Pattern aligné sur
  // DeleteAccountModal / LoginModal / ConfirmModal (homogénéisation
  // a11y des modales).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setEmail("");
      setError("");
      setLoading(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll-lock du body pendant l'ouverture (empêche le scroll
  // arrière-plan de défiler quand la modale est focusée).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus input à l'ouverture (remplace autoFocus déprécié a11y). Délai
  // 50 ms : laisse le mount terminer avant de voler le focus, sinon les
  // readers d'écran ratent l'annonce du dialog.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  // Escape pour fermer — bloqué pendant le loading (sinon l'user
  // fermerait la modale entre le clic submit et le redirect Stripe,
  // mauvaise UX).
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  // Validation V1 inchangée : minimaliste (présence + "@") — l'email
  // sera revalidé côté backend lors du POST checkout.
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
      {/* Overlay : bg-black/80 + backdrop-blur DS. Clic = onClose
          (sauf pendant loading — cf. Escape handler). */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />

      {/* DialogContent : surface noir/40, bordure subtile, radius 16
          (= --radius DS), padding 32 px. max-w 480 px pour rester
          confortable sur petit contenu. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-checkout-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-surface-1 p-6 sm:p-8"
      >
        {/* Close X — Phosphor, taille 5 (=20 px), muted → foreground
            au hover, transitions douces DS. */}
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
            className={fieldCls}
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
                {/* Spinner doré DS — même token que le loading state
                    de la page profil. */}
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
