"use client";

import { useRef, useState, type FormEvent } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { useUser } from "@/hooks/use-user";
import { formDaModalInputCls } from "@/lib/form-da";

// Clé sessionStorage utilisée pour porter une destination "post-login"
// entre l'envoi du magic-link (ici) et l'effet de redirection dans
// HeaderAuth (qui réagit à la transition user null → défini).
// Exportée pour rester source unique de vérité.
export const POST_LOGIN_REDIRECT_KEY = "plarya_post_login_redirect";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Titre du modal (défaut "Se connecter"). À surcharger pour rendre
   *  l'intent contextuel — ex : "Connecte-toi pour devenir créateur". */
  title?: string;
  /** Description sous le titre (défaut neutre). */
  description?: string;
  /** Chemin où renvoyer l'utilisateur une fois loggué. Stocké en
   *  sessionStorage avant l'envoi du magic-link ; HeaderAuth le consomme
   *  quand le cookie de session est posé et que `useUser` re-fetch
   *  l'utilisateur connecté. Si omis, retour à l'accueil. */
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

  // ── Reset states + onClose parent ──
  // Reset des states : une réouverture future part propre
  // (form vide, pas d'erreur résiduelle, branche initiale).
  function handleClose() {
    setEmail("");
    setError("");
    setSent(false);
    onClose();
  }

  // a11y : scroll-lock body, focus initial (input email), focus trap,
  // Escape, restauration du focus à la fermeture — cf. useModalA11y.
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
      // ── POST_LOGIN_REDIRECT_KEY ──
      // Posé AVANT l'appel API : si l'utilisateur clique le lien magic-
      // link depuis le même navigateur, sessionStorage est dispo dès le
      // retour. Ne PAS déplacer après le `await`.
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
      {/* Overlay — bg-black/80 backdrop-blur-md. Clic = handleClose. */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden
      />

      {/* DialogContent — bg-background (#000), bordure subtile, radius 16
          DS, padding 32. max-w 480 px aligné avec EmailCheckoutModal et
          la modale upsell pour cohérence des modales. */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border border-surface-elevated bg-surface-1 p-6 sm:p-8"
      >
        {/* Close X — Phosphor, taille 5 (=20 px). */}
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
