"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

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

// Pattern input DS aligné /devenir-expert + EmailCheckoutModal + /compte.
// Inline ici pour éviter une dépendance — à factoriser dans
// lib/styles si on en ajoute un 4ᵉ consommateur.
const fieldCls = cn(
  "h-12 w-full rounded-xl border border-surface-elevated bg-black/40 px-4 py-3",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent/60 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

// Sélecteur des éléments focusables pour le focus trap. Inclut les
// <button>, <a>, <input>, etc. ; exclut explicitement ceux marqués
// `disabled` ou `tabindex="-1"`.
const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

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

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Reset states + onClose parent ──
  // Conserve le comportement V1 : une réouverture future part propre
  // (form vide, pas d'erreur résiduelle, branche initiale).
  function handleClose() {
    setEmail("");
    setError("");
    setSent(false);
    onClose();
  }

  // ── Scroll lock du body ──
  // Empêche le contenu derrière l'overlay de scroller pendant que la
  // modale est ouverte. Restore la valeur précédente au cleanup pour
  // jouer nice avec d'autres modales potentielles.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus input à l'ouverture (remplace autoFocus déprécié a11y). Délai
  // 50 ms : laisse le mount + animations terminer avant de voler le
  // focus, sinon les readers d'écran ratent l'annonce du dialog.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open, sent]);

  // ── Focus trap + Escape ──
  // Un seul listener `keydown` global, attaché tant que la modale est
  // ouverte. Escape ferme la modale ; Tab / Shift+Tab cyclent dans les
  // éléments focusables internes (boucle premier ↔ dernier).
  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;

      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      ); // visible only

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // handleClose est stable (pas de deps externes hors setState), on
    // évite de la mettre dans les deps pour ne pas re-attacher
    // l'écouteur à chaque render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
        ref={dialogRef}
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
                className={fieldCls}
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
