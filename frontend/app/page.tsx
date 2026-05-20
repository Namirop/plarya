"use client";

import { useState } from "react";

import { Hero } from "@/components/home/hero";
import { TrustRow } from "@/components/home/trust-row";
import { DomainsSection, type DomainId } from "@/components/home/domains-section";
import { ExpertsSection } from "@/components/home/experts-section";
import { PourquoiPlaryaSection } from "@/components/home/pourquoi-plarya-section";
import { DevenirCreateurSection } from "@/components/home/devenir-createur-section";
import { Disclaimer } from "@/components/home/disclaimer";
import { SectionSeparator } from "@/components/ui/section-separator";

export default function Home() {
  // Filtre domaine in-page (reproduction V1 — bae3a79 page.tsx).
  // null = pas de filtre, sinon "SPORT" ou "ESPORT". Re-cliquer sur le
  // domaine actif le désélectionne (toggle).
  const [activeDomain, setActiveDomain] = useState<DomainId | null>(null);

  function handleDomainSelect(domain: DomainId) {
    const next = activeDomain === domain ? null : domain;
    setActiveDomain(next);
    // Scroll vers la section experts uniquement quand on ACTIVE un
    // filtre (pas quand on le désactive). Cf. V1 : `if (domain && ...)`.
    if (next) {
      document
        .getElementById("experts")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="relative overflow-hidden">
      <Hero />
      {/* TrustRow standalone — mobile-only (3 cards stackées). En desktop
          la même TrustRow est rendue à l'intérieur du Hero. */}
      <TrustRow variant="standalone" className="md:hidden" />
      <DomainsSection
        activeDomain={activeDomain}
        onDomainSelect={handleDomainSelect}
      />
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
