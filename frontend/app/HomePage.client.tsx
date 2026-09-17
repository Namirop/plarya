"use client";

import { useState } from "react";

import { DevenirCreateurSection } from "@/components/home/devenir-createur-section";
import { Disclaimer } from "@/components/home/disclaimer";
import { DomainsSection, type DomainId } from "@/components/home/domains-section";
import { ExpertsSection } from "@/components/home/experts-section";
import { Hero } from "@/components/home/hero";
import { PourquoiPlaryaSection } from "@/components/home/pourquoi-plarya-section";
import { TrustRow } from "@/components/home/trust-row";
import { Reveal } from "@/components/ui/reveal";
import { SectionSeparator } from "@/components/ui/section-separator";

// Partage le filtre de domaine entre DomainsSection et ExpertsSection ;
// défile vers #experts seulement quand un filtre est activé.
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
      {/* Au-dessus de la ligne de flottaison : pas d'animation d'entrée. */}
      <Hero />
      {/* Version mobile ; en desktop, TrustRow est rendue dans le Hero. */}
      <Reveal>
        <TrustRow variant="standalone" className="md:hidden" />
      </Reveal>
      {/* DomainsSection anime elle-même l'apparition de ses cartes. */}
      <DomainsSection activeDomain={activeDomain} onDomainSelect={handleDomainSelect} />
      <Reveal>
        <ExpertsSection filterDomain={activeDomain} />
      </Reveal>
      <Reveal>
        <PourquoiPlaryaSection />
      </Reveal>
      <Reveal>
        <DevenirCreateurSection />
      </Reveal>
      {/* Sépare le contenu de la page de la mention légale. */}
      <SectionSeparator />
      <Disclaimer />
    </div>
  );
}
