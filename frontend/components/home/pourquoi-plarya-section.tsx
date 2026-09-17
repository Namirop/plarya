import { Fragment, type ComponentType } from "react";

import { Clock, Lightning, CreditCard, type IconProps } from "@phosphor-icons/react";

import { DividerVertical } from "@/components/ui/divider-vertical";
import { MarketingSectionTitle } from "@/components/ui/section-title";

type Pillar = {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
};

const PILLARS: Pillar[] = [
  {
    icon: Clock,
    title: "Gain de temps",
    description: "Accédez directement aux analyses. Pas de recherche, pas de bruit.",
  },
  {
    icon: Lightning,
    title: "Simple",
    description: "Tout est prêt. Choisissez un expert, accédez à ses sélections.",
  },
  {
    icon: CreditCard,
    title: "Sans engagements",
    description: "Paiement à l'acte. 3,50€ le jour, sans abonnement obligatoire.",
  },
];

export function PourquoiPlaryaSection() {
  return (
    <section className="pt-16">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <MarketingSectionTitle title={<>Pourquoi Plarya ?</>} />

        <div className="mt-6 rounded-2xl bg-black/40 p-8 md:px-[60px] md:py-5">
          {/* Séparateurs horizontaux en mobile, verticaux en desktop. */}
          <div className="flex flex-col items-stretch justify-center gap-8 md:flex-row md:items-center md:gap-12">
            {PILLARS.map((pillar, i) => (
              <Fragment key={pillar.title}>
                {i > 0 && (
                  <>
                    <DividerVertical
                      height={192}
                      orientation="horizontal"
                      className="self-center md:hidden"
                    />
                    <DividerVertical height={192} className="hidden md:block" />
                  </>
                )}
                <div className="flex flex-col items-start">
                  <pillar.icon className="size-6 md:size-[30px] text-muted-foreground" />
                  <h3 className="mt-4 md:mt-6 font-body text-h5 md:text-h4 text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 md:mt-4 font-body text-[14px] md:text-body-16 leading-[1.4] text-muted-foreground">
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
