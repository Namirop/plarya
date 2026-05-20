import { Hero } from "@/components/home/hero";
import { DomainsSection } from "@/components/home/domains-section";
import { ExpertsSection } from "@/components/home/experts-section";
import { PourquoiPlaryaSection } from "@/components/home/pourquoi-plarya-section";
import { DevenirCreateurSection } from "@/components/home/devenir-createur-section";
import { Disclaimer } from "@/components/home/disclaimer";
import { SectionSeparator } from "@/components/ui/section-separator";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <Hero />
      <DomainsSection />
      <ExpertsSection />
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
