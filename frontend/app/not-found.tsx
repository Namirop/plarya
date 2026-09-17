import Link from "next/link";

import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

// Page 404 : route inconnue ou appel à notFound().

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que tu cherches n'existe pas ou a été déplacée.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-6 py-16 text-center">
      <p
        aria-hidden
        className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text font-display leading-[0.85] text-transparent text-[120px] sm:text-[160px] md:text-[200px] lg:text-[240px]"
      >
        404
      </p>

      <h1 className="mt-6 max-w-[560px] font-body text-[22px] font-bold leading-[1.2] text-foreground md:text-[28px]">
        Cette page n&apos;existe pas.
      </h1>

      <p className="mt-3 max-w-[480px] font-body text-body-16 leading-[1.55] text-muted-foreground">
        Le lien est peut-être expiré, ou la page a été déplacée. Reviens à l&apos;accueil ou explore
        les experts.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button variant="primary" size="lg" render={<Link href="/" />}>
          Retour à l&apos;accueil
        </Button>
        <Button variant="secondary" size="lg" render={<Link href="/" />}>
          Voir les experts
        </Button>
      </div>
    </div>
  );
}
