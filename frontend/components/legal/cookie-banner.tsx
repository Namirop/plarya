"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

// Nom du cookie de consentement. Le cookie est posé par cette même
// bannière donc il est essentiel par nature (pas de consentement
// requis pour les cookies de consentement eux-mêmes, cf. doctrine
// CNIL).
const CONSENT_COOKIE = "plarya_cookie_consent";
const CONSENT_TTL_DAYS = 365;

// Pages où on ne montre pas la bannière (zones internes auth-gated).
// Le visiteur arrive forcément par la home / une page publique
// d'abord, où il aura déjà fait son choix.
const HIDDEN_PREFIXES = ["/admin", "/dashboard"];

function readConsentCookie(): "accepted" | "refused" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]+)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return value === "accepted" || value === "refused" ? value : null;
}

function writeConsentCookie(value: "accepted" | "refused"): void {
  if (typeof document === "undefined") return;
  const maxAge = CONSENT_TTL_DAYS * 24 * 60 * 60;
  // SameSite=Lax + path=/. Pas de Secure flag en dev (HTTP local) ;
  // en prod (HTTPS), le browser autorise quand même le set même
  // sans Secure pour les cookies pas spécifiquement marqués sensibles.
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const pathname = usePathname();
  // visible = ne render PAS sur le premier server-render (SSR ne
  // connaît pas le cookie côté browser, on attend l'hydratation
  // pour décider). Évite le flash "bannière qui apparaît puis
  // disparaît" pour les users qui ont déjà donné leur consentement.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Lecture du cookie côté client uniquement (document.cookie n'est
    // pas dispo côté serveur). Le setState ici est canonique pour
    // "browser-only data discovered after hydratation" — la règle
    // react-hooks/set-state-in-effect est trop conservatrice pour
    // ce cas (cf. React docs sur l'hydratation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(readConsentCookie() === null);
  }, []);

  if (!visible) return null;
  if (pathname && HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  function handleAccept() {
    writeConsentCookie("accepted");
    setVisible(false);
  }

  function handleRefuse() {
    writeConsentCookie("refused");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-5xl rounded-2xl border border-surface-elevated bg-background px-6 py-5 md:px-8"
    >
      {/* Bar large et basse : texte à gauche, actions à droite, le tout
          vertical-centré (md:items-center) → respire et reste compact en
          hauteur. Gap horizontal généreux (md:gap-10). */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
        <div className="flex-1">
          <h2 id="cookie-banner-title" className="font-body text-h5 font-bold text-foreground">
            Cookies
          </h2>
          <p id="cookie-banner-desc" className="mt-1.5 font-body text-body-16 text-muted-foreground">
            Plarya utilise uniquement des cookies essentiels nécessaires au fonctionnement du site
            (authentification, session). Pas d&apos;analytics, pas de tracking tiers. En savoir plus
            dans notre{" "}
            <Link
              href="/confidentialite"
              className="text-foreground underline transition-opacity hover:opacity-80"
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
        {/* Actions côte à côte (row) sur tous les breakpoints → bar
            courte. shrink-0 pour ne pas compresser les boutons. */}
        <div className="flex shrink-0 gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefuse}
            className="flex-1 md:flex-none md:w-32"
          >
            Refuser
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAccept}
            className="flex-1 md:flex-none md:w-32"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
