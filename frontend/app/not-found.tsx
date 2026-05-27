import Link from "next/link";

import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

// Page 404 globale — déclenchée par Next quand une route est inconnue
// ou qu'un Server Component appelle notFound().
//
// Layout : "404" en énorme (~200px desktop, ~120px mobile) en gradient
// doré, message court + CTAs sous. Pattern type-driven : le code 404
// porte tout, le message reste secondaire. Centré vh/hz comme les
// InfoScreen mais design dédié (le "404" prend trop de place pour
// rentrer dans le pattern générique).

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que tu cherches n'existe pas ou a été déplacée.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
      {/* "404" jumbo — font-display, gradient doré (from-amber-200 →
          amber-500), line-height 0.85 ultra-serré pour densifier le
          numéro. Le gradient doré ici est volontaire : 404 est un
          moment "spécial" qui mérite l'accent (1 seul par page). */}
      <p
        aria-hidden
        className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text font-display leading-[0.85] text-transparent text-[120px] sm:text-[160px] md:text-[200px] lg:text-[240px]"
      >
        404
      </p>

      {/* Message principal — body large, plus contenu que H1. Pas de
          font-display ici : c'est un message d'accompagnement, pas
          un titre principal (le "404" porte le titre). */}
      <h1 className="mt-6 max-w-[560px] font-body text-[22px] font-bold leading-[1.2] text-foreground md:text-[28px]">
        Cette page n&apos;existe pas.
      </h1>

      <p className="mt-3 max-w-[480px] font-body text-body-16 leading-[1.55] text-muted-foreground">
        Le lien est peut-être expiré, ou la page a été déplacée. Reviens à l&apos;accueil ou
        explore les experts.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button variant="primary" size="lg" render={<Link href="/" />}>
          Retour à l&apos;accueil
        </Button>
        <Button variant="secondary" size="lg" render={<Link href="/experts" />}>
          Voir les experts
        </Button>
      </div>
    </div>
  );
}
