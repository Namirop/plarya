"use client";

import { Suspense, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

// Pattern input DS aligné /devenir-expert + EmailCheckoutModal.
const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

export default function AuthVerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error === "expired") {
    return <ErrorState message="Ce lien a expiré ou a déjà été utilisé." />;
  }

  if (error === "invalid") {
    return <ErrorState message="Lien de connexion invalide." />;
  }

  if (error === "deleted") {
    // Email récemment supprimé → en cooldown post-suppression.
    // Pas de formulaire de renvoi (le request reste silencieusement
    // bloqué côté backend pendant le cooldown).
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-h4 text-foreground">Ce compte a été supprimé.</h1>
          <p className="mt-4 font-body text-body-16 text-muted-foreground">
            La connexion avec cet email est temporairement indisponible. Réessaie dans quelques
            jours, ou utilise un autre email pour créer un nouveau compte.
          </p>
        </div>
      </div>
    );
  }

  // If no error param, the backend redirect should have set the cookie
  // and redirected to the final destination. This page is a fallback.
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-body text-body-16 text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const { requestMagicLink } = useUser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email.trim() || !email.includes("@")) {
      setError("Email invalide");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-h4 text-foreground">{message}</h1>

        {sent ? (
          <p className="mt-4 font-body text-body-16 text-muted-foreground">
            Un nouveau lien a été envoyé à <strong className="text-foreground">{email}</strong>.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="font-body text-body-16 text-muted-foreground">
              Entrez votre email pour recevoir un nouveau lien.
            </p>

            {error && (
              <p role="alert" className="font-body text-body-16 text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-2 text-left">
              <label
                htmlFor="resend-email"
                className="font-body text-body-16 text-muted-foreground"
              >
                Email
              </label>
              <input
                id="resend-email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={submitting}
                className={fieldCls}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleResend}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Envoi..." : "Demander un nouveau lien"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
