"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { createCheckoutSession } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmailCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  tipsterId: string;
  type: "DAY_PASS" | "MONTHLY";
}

// Styles input alignés avec /devenir-tipster et le Dashboard pour
// cohérence visuelle des champs DS (fond noir 40 %, bordure subtile,
// focus accent doré).
const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

export function EmailCheckoutModal({
  open,
  onClose,
  tipsterId,
  type,
}: EmailCheckoutModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const url = await createCheckoutSession(tipsterId, type, trimmed);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay : bg-black/80 + backdrop-blur DS. Clic = onClose
          (comportement V1 conservé). */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      {/* DialogContent : surface noir/40, bordure subtile, radius 16
          (= --radius DS), padding 32 px. max-w 480 px pour rester
          confortable sur petit contenu. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-checkout-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-background p-8"
      >
        {/* Close X — lucide-react, taille 5 (=20 px), muted → foreground
            au hover, transitions douces DS. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <h2
          id="email-checkout-title"
          className="font-display text-h4 text-foreground"
        >
          Accédez aux analyses
        </h2>
        <p className="mt-2 font-body text-body-16 text-muted-foreground">
          Entrez votre email pour recevoir l&apos;accès et votre facture
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldCls}
            autoFocus
            disabled={loading}
          />
          {error && (
            <p
              role="alert"
              className="font-body text-body-16 text-destructive"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
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
