"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

// Cookie mémorisant le choix : strictement nécessaire, il ne requiert pas
// lui-même de consentement (lignes directrices CNIL).
const CONSENT_COOKIE = "plarya_cookie_consent";
const CONSENT_TTL_DAYS = 365;

// Espaces connectés : on y arrive depuis une page publique où la bannière
// a déjà été proposée.
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
  // Sans attribut Secure : cookie non sensible, utilisable aussi en HTTP local.
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const pathname = usePathname();
  // Masquée au rendu serveur, qui ne voit pas le cookie : pas d'apparition
  // furtive pour qui a déjà fait son choix.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Donnée propre au navigateur, connue seulement après hydratation.
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
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
        <div className="flex-1">
          <h2 id="cookie-banner-title" className="font-body text-h5 font-bold text-foreground">
            Cookies
          </h2>
          <p
            id="cookie-banner-desc"
            className="mt-1.5 font-body text-body-16 text-muted-foreground"
          >
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
