import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GoldenBorderOverlay } from "@/components/ui/golden-border-overlay";

export function DevenirCreateurSection() {
  return (
    // pt-16 = 64 px (gap depuis Pourquoi Plarya).
    <section className="pt-16">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* Card "outline" : bordure conic-gradient dorée (haut-gauche +
            bas-droite très visibles, sombre ailleurs), même pattern
            visuel que le cadre du Hero (cf. GoldenBorderOverlay). PAS
            de fond — distinct de Pourquoi Plarya qui a `bg-black/40`
            sans bordure. */}
        <div className="relative flex items-center justify-between rounded-2xl px-16 py-8">
          <GoldenBorderOverlay />
          <div className="flex flex-col gap-4">
            <h3 className="font-body text-h4 text-foreground">
              Partage ton expertise et génère des revenus
            </h3>
            <p className="font-body text-body-16 text-muted-foreground">
              Rejoins Plarya en tant que créateur et monétise tes analyses
              auprès d&apos;une communauté engagée.
            </p>
          </div>

          {/* La page d'inscription existe au chemin /devenir-tipster
              (nom interne historique — vocabulaire interne, cf.
              CLAUDE.md §1.1 sur la coexistence "tipster" en code). */}
          <Button
            variant="primary"
            size="lg"
            render={<Link href="/devenir-tipster" />}
          >
            Devenir créateur
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
