"use client";

import { useRef, useState, type FormEvent } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { useUser } from "@/hooks/use-user";
import { formDaModalInputCls } from "@/lib/form-da";

// Clé sessionStorage de la destination post-connexion, lue par HeaderAuth.
export const POST_LOGIN_REDIRECT_KEY = "plarya_post_login_redirect";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Chemin où renvoyer l'utilisateur une fois connecté (voir POST_LOGIN_REDIRECT_KEY). */
  redirectAfterLogin?: string;
}

export function LoginModal({
  open,
  onClose,
  title = "Se connecter",
  description = "Entre ton email pour recevoir un lien de connexion.",
  redirectAfterLogin,
}: LoginModalProps) {
  const { requestMagicLink } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Réinitialise le formulaire pour la prochaine ouverture.
  function handleClose() {
    setEmail("");
    setError("");
    setSent(false);
    onClose();
  }

  const { containerRef } = useModalA11y({
    open,
    onClose: handleClose,
    initialFocusRef: inputRef,
  });

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Email invalide");
      return;
    }
    setSubmitting(true);
    try {
      // Enregistré avant l'appel API. Limite connue : sessionStorage est propre
      // à l'onglet, un lien ouvert dans un nouvel onglet ne redirige pas.
      if (redirectAfterLogin && typeof window !== "undefined") {
        sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectAfterLogin);
      }
      await requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

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
        aria-labelledby="login-modal-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-surface-1 p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer la modale"
          className="absolute right-4 top-4 cursor-pointer p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {sent ? (
          <>
            <h2
              id="login-modal-title"
              className="font-body text-[22px] font-bold text-foreground md:text-h4 pr-10"
            >
              Vérifie ta boîte mail
            </h2>
            <p className="mt-3 font-body text-body-16 text-muted-foreground">
              Un lien de connexion a été envoyé à{" "}
              <strong className="text-foreground">{email}</strong>. Clique dessus pour te connecter.
            </p>
            <p className="mt-3 font-body text-body-16 text-muted-foreground/70">
              Le lien expire dans 15 minutes.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleClose}
              className="mt-6 w-full whitespace-normal px-4 text-body-16 sm:px-8 sm:text-h5"
            >
              Fermer
            </Button>
          </>
        ) : (
          <>
            <h2
              id="login-modal-title"
              className="font-body text-[22px] font-bold text-foreground md:text-h4 pr-10"
            >
              {title}
            </h2>
            <p className="mt-2 font-body text-body-16 text-muted-foreground">{description}</p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              {error && (
                <p role="alert" className="font-body text-body-16 text-destructive">
                  {error}
                </p>
              )}
              <label htmlFor="login-email" className="sr-only">
                Ton email
              </label>
              <input
                ref={inputRef}
                id="login-email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={formDaModalInputCls}
                autoComplete="email"
                disabled={submitting}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                className="w-full whitespace-normal px-4 text-body-16 sm:px-8 sm:text-h5"
              >
                {submitting ? "Envoi…" : "Recevoir mon lien de connexion"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
