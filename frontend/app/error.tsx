"use client";

import { useEffect } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Page d'erreur des routes, même présentation que not-found.tsx. Composant
// client, imposé par Next pour exposer `reset()`.

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Console en développement ; en production, le digest renvoie aux logs serveur.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorPage]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
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

      {/* Référence à communiquer au support. */}
      {error.digest && (
        <p className="mt-4 font-mono text-[12px] text-muted-foreground/50">Réf. {error.digest}</p>
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
