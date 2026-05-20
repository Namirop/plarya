"use client";

import { useState, type FormEvent } from "react";
import { useUser } from "@/hooks/use-user";

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

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) { setError("Email invalide"); return; }
    setSubmitting(true);
    try {
      // On stocke la destination AVANT l'appel API : si l'utilisateur
      // clique sur le lien magic-link depuis un autre onglet/device, le
      // sessionStorage local restera quand même utilisable si l'auth
      // termine sur le même navigateur (cas typique en local dev).
      if (redirectAfterLogin && typeof window !== "undefined") {
        sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectAfterLogin);
      }
      await requestMagicLink(email);
      setSent(true);
    }
    catch (err) { setError(err instanceof Error ? err.message : "Erreur lors de l'envoi"); }
    finally { setSubmitting(false); }
  }

  function handleClose() { setEmail(""); setError(""); setSent(false); onClose(); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 mx-4 w-full max-w-md rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-6">
        <button type="button" onClick={handleClose} className="absolute top-4 right-4 text-[#8A8680] hover:text-[#F0EDE8] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {sent ? (
          <>
            <h3 className="text-xl font-bold text-[#F0EDE8]">Vérifie ta boîte mail</h3>
            <p className="mt-3 text-sm text-[#8A8680]">
              Un lien de connexion a été envoyé à <strong className="text-[#F0EDE8]">{email}</strong>. Clique dessus pour te connecter.
            </p>
            <p className="mt-2 text-xs text-[#8A8680]/60">Le lien expire dans 15 minutes.</p>
            <button type="button" onClick={handleClose}
              className="mt-6 w-full rounded-md bg-[#F0EDE8] px-4 py-3 text-sm font-bold text-[#080808] transition-all hover:bg-[#00D47E]">
              Fermer
            </button>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-[#F0EDE8]">{title}</h3>
            <p className="mt-2 text-sm text-[#8A8680]">{description}</p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <input
                id="login-email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-[#080808] ring-1 ring-[#1A1A1A] px-4 py-3 text-[#F0EDE8] placeholder:text-[#8A8680]/40 focus:ring-[#00D47E]/50 focus:outline-none transition-colors"
                autoComplete="email"
                autoFocus
              />
              <button type="submit" disabled={submitting}
                className="w-full rounded-md bg-[#F0EDE8] px-4 py-3 text-sm font-bold text-[#080808] transition-all hover:bg-[#00D47E] disabled:opacity-50">
                {submitting ? "Envoi..." : "Recevoir mon lien de connexion"}
              </button>
            </form>

            <button type="button" onClick={handleClose}
              className="mt-4 flex w-full items-center justify-center text-sm text-[#8A8680] hover:text-[#F0EDE8] transition cursor-pointer">
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
