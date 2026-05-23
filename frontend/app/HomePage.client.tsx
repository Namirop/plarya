"use client";

import { useState } from "react";

import { DevenirCreateurSection } from "@/components/home/devenir-createur-section";
import { Disclaimer } from "@/components/home/disclaimer";
import { DomainsSection, type DomainId } from "@/components/home/domains-section";
import { ExpertsSection } from "@/components/home/experts-section";
import { Hero } from "@/components/home/hero";
import { PourquoiPlaryaSection } from "@/components/home/pourquoi-plarya-section";
import { TrustRow } from "@/components/home/trust-row";
import { SectionSeparator } from "@/components/ui/section-separator";

// HomePage côté client. Wrapper de la coordination scroll/filtre
// entre <DomainsSection> et <ExpertsSection>. Le state activeDomain
// est partagé entre les deux composants ; le scroll vers #experts
// est déclenché uniquement quand on ACTIVE un filtre (V1 inchangé).
//
// La page.tsx parent reste server component pour permettre une
// future migration de fetch SSR (ExpertsSection fetch encore
// client-side ; à server-ifier en Phase Polish quand on aura un
// endpoint qui inclut la liste pré-filtrée).
export function HomePageClient() {
  const [activeDomain, setActiveDomain] = useState<DomainId | null>(null);

  function handleDomainSelect(domain: DomainId) {
    const next = activeDomain === domain ? null : domain;
    setActiveDomain(next);
    if (next) {
      document.getElementById("experts")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="relative overflow-hidden">
      <Hero />
      {/* TrustRow standalone — mobile-only (3 cards stackées). En desktop
          la même TrustRow est rendue à l'intérieur du Hero. */}
      <TrustRow variant="standalone" className="md:hidden" />
      <DomainsSection activeDomain={activeDomain} onDomainSelect={handleDomainSelect} />
      <ExpertsSection filterDomain={activeDomain} />
      <PourquoiPlaryaSection />
      <DevenirCreateurSection />
      {/* Seul séparateur conservé : entre Devenir créateur et la zone
          légale (disclaimer). Marque visuellement la fin de la LP
          "commerciale" et l'entrée dans la zone légale. */}
      <SectionSeparator />
      <Disclaimer />
    </div>
  );
}
