"use client";

import { useEffect } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Page d'erreur globale — déclenchée par Next quand une erreur runtime
// non-catchée remonte jusqu'à la racine. DA identique à app/not-found.tsx :
// gros code d'erreur en gradient doré, titre éditorial, message court,
// 2 CTAs. Le composant est obligatoirement "use client" (cf. Next App
// Router : error.tsx doit être un Client Component pour exposer le
// callback `reset()`).
//
// Note : ce fichier capture les erreurs RUNTIME (côté client/serveur)
// dans la route tree. Pour les vraies "500" SSR, Next sert ce composant
// si l'erreur n'est pas catchée plus haut.

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Log côté client en dev pour faciliter le debug. En prod le digest
  // suffit (associé à un log côté serveur via la stack Next).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // TODO observabilité : ce console reste dev-only (en prod, l'erreur
      // est tracée via le digest Next + les logs serveur). À router vers
      // Sentry/Logflare le jour où on veut de l'alerting.
      console.error("[ErrorPage]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
      {/* "500" jumbo — pattern identique au 404 : font-display, gradient
          doré, leading 0.85 pour densifier le numéro. */}
      <p
        aria-hidden
        className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text font-display leading-[0.85] text-transparent text-[120px] sm:text-[160px] md:text-[200px] lg:text-[240px]"
      >
        500
      </p>

      <h1 className="mt-6 max-w-[560px] font-body text-[22px] font-bold leading-[1.2] text-foreground md:text-[28px]">
        Une erreur est survenue.
      </h1>

      <p className="mt-3 max-w-[480px] font-body text-body-16 leading-[1.55] text-muted-foreground">
        Quelque chose s&apos;est mal passé de notre côté. Tu peux réessayer ou revenir à
        l&apos;accueil. Si le problème persiste, contacte-nous.
      </p>

      {/* Digest visible en muted très subtil — utile pour reporter
          l'incident au support. Affiché uniquement quand fourni. */}
      {error.digest && (
        <p className="mt-4 font-mono text-[12px] text-muted-foreground/50">
          Réf. {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button type="button" variant="primary" size="lg" onClick={reset}>
          Réessayer
        </Button>
        <Button variant="secondary" size="lg" render={<Link href="/" />}>
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
