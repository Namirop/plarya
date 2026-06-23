import { FaqItem } from "@/components/devenir-expert/faq-item";
import { Reveal } from "@/components/ui/reveal";

import { SectionHeader } from "./section-header";

// ════════════════ SECTION 4 — FAQ ════════════════
// 4 accordions <FaqItem>, titre éditorial centré, max-w resserré.
export function FaqSection() {
  return (
    <section className="mx-auto mt-20 mb-20 w-full max-w-[720px] px-4 md:mt-24 md:mb-24 md:px-8">
      <Reveal>
        <SectionHeader eyebrow="Questions fréquentes" title="Tout ce que tu dois savoir" />
      </Reveal>

      <div className="mt-10 space-y-3">
        <Reveal delay={0}>
          <FaqItem
            question="Comment fonctionne le paiement ?"
            answer="Tu paies 39€ tous les 3 mois par carte bancaire via Stripe. Le paiement est automatique. Tu peux annuler à tout moment depuis ton compte — l'accès reste actif jusqu'à la fin de la période payée."
          />
        </Reveal>
        <Reveal delay={0.08}>
          <FaqItem
            question="Quel pourcentage Plarya prend-elle ?"
            answer="Tu gardes 80% du chiffre d'affaires généré par tes analyses (day passes à 3,50€ et abonnements à 29€/mois). Plarya conserve 20% pour l'hébergement, les paiements et la mise en avant."
          />
        </Reveal>
        <Reveal delay={0.16}>
          <FaqItem
            question="Quand suis-je payé ?"
            answer="Les revenus sont versés mensuellement sur ton compte bancaire (via Stripe Connect, configuré depuis ton dashboard). Premier versement environ 30 jours après ta première vente."
          />
        </Reveal>
        <Reveal delay={0.24}>
          <FaqItem
            question="Puis-je quitter Plarya à tout moment ?"
            answer="Oui. Tu peux supprimer ton compte depuis ta page Mon Compte. Les abonnements actifs de tes clients courent jusqu'à leur date d'expiration naturelle, puis sont automatiquement résiliés. Tes données sont anonymisées dans les 30 jours."
          />
        </Reveal>
      </div>
    </section>
  );
}
