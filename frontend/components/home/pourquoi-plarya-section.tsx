import { Icon } from "@iconify/react";
import { Fragment } from "react";

import { DividerVertical } from "@/components/ui/divider-vertical";
import { SectionTitle } from "@/components/ui/section-title";

// 3 piliers de réassurance. Wording verbatim de la maquette Figma
// (frame `94:824`), cf. pourquoi-plarya-section-spec.md §3.
const PILLARS = [
  {
    icon: "solar:clock-circle-outline",
    title: "Gain de temps",
    description: "Accédez directement aux analyses. Pas de recherche, pas de bruit.",
  },
  {
    icon: "mynaui:lightning",
    title: "Simple",
    description: "Tout est prêt. Choisissez un expert, accédez à ses sélections.",
  },
  {
    // Même icône carte de crédit que le Trust row du Hero — cohérence
    // graphique entre les deux blocs de réassurance de la page.
    icon: "f7:creditcard",
    title: "Sans engagements",
    description: "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire.",
  },
];

export function PourquoiPlaryaSection() {
  return (
    // pt-16 = 64 px (gap depuis Experts).
    <section className="pt-16">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* Header HORS de la card encadrée (conforme à la maquette
            Figma — voir pourquoi-plarya-section-spec.md §2). Le "?"
            est en doré accent — pattern unique à cette section. */}
        <SectionTitle
          title={
            <>
              Pourquoi Plarya <span className="text-accent">?</span>
            </>
          }
        />

        {/* Card encadrée : fond noir 40 %, radius 16, padding 88×40.
            Gap header → card = 24 px (mt-6, rapproché vs mt-8 précédent
            pour cohérence avec les autres sections de la home). */}
        <div className="mt-6 rounded-2xl bg-black/40 px-[88px] py-10">
          {/* 3 piliers — flex horizontal, gap 48 px, centrés, séparés
              par 2 DividerVertical de 192 px. */}
          <div className="flex items-center justify-center gap-12">
            {PILLARS.map((pillar, i) => (
              <Fragment key={pillar.title}>
                {i > 0 && <DividerVertical height={192} />}
                <div className="flex flex-col items-start">
                  <Icon
                    icon={pillar.icon}
                    width={30}
                    height={30}
                    className="text-accent"
                  />
                  <h3 className="mt-6 font-body text-h4 text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 font-body text-body-16 text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
