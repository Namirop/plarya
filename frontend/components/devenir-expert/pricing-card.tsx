import { Check } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// Prix de l'abonnement expert et avantages inclus, dans le formulaire de
// candidature ; le prix est le seul élément doré de la carte.

export interface PricingCardProps {
  className?: string;
}

const INCLUDED = [
  "Accès au dashboard expert",
  "Publication illimitée d'analyses",
  "Mise en avant dans les listings",
  "Versements mensuels (70% pour toi)",
] as const;

export function PricingCard({ className }: PricingCardProps) {
  return (
    <div
      className={cn(
        // Un niveau d'élévation au-dessus du formulaire qui la contient.
        "rounded-lg border border-white/10 bg-surface-3 p-6 md:p-7",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-body text-[32px] font-bold leading-none tabular-nums text-accent md:text-[36px]">
          39€{" "}
          <span className="font-body text-body-16 font-normal text-muted-foreground">
            / trimestre
          </span>
        </p>
        <p className="hidden font-body text-[12px] uppercase tracking-wider text-muted-foreground sm:block">
          Renouvellement auto
        </p>
      </div>

      <div aria-hidden className="my-3 h-px w-full bg-surface-3" />

      <ul className="space-y-2.5">
        {INCLUDED.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check
              size={16}
              weight="bold"
              className="mt-1 shrink-0 text-foreground"
              aria-hidden
            />
            <span className="font-body text-body-16 text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
