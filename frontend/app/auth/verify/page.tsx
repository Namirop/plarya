"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";

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

  // If no error param, the backend redirect should have set the cookie
  // and redirected to the final destination. This page is a fallback.
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-texte-secondaire">Connexion en cours...</p>
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
        <h1 className="text-xl font-bold text-blanc">{message}</h1>

        {sent ? (
          <p className="mt-4 text-sm text-texte-secondaire">
            Un nouveau lien a été envoyé à <strong className="text-blanc">{email}</strong>.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-texte-secondaire">
              Entrez votre email pour recevoir un nouveau lien.
            </p>

            {error && (
              <p className="text-sm text-rouge-erreur">{error}</p>
            )}

            <div className="space-y-2 text-left">
              <label htmlFor="resend-email" className="text-sm text-texte-secondaire">Email</label>
              <input
                id="resend-email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-bordure bg-fond-principal px-4 py-3 text-blanc placeholder:text-texte-tertiaire focus:border-or-principal/50 focus:outline-none focus:ring-1 focus:ring-or-principal/50 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className="w-full h-10 rounded-lg border border-or-principal/30 bg-gradient-to-r from-or-principal/10 to-or-principal/5 text-sm font-bold text-blanc transition-all hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:border-or-principal/50 disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Demander un nouveau lien"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
