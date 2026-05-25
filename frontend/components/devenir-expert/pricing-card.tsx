import { Check } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

// Card "39€ / trimestre" affichée dans la section §3 (Form). Donne du
// poids au prix : header avec le prix en gros doré (seul accent doré
// conservé sur la card), label discret à droite (renouvellement auto),
// divider neutre, puis 4 bullets check blancs.
//
// Polish v2 : le glow doré (border-accent/30 + shadow-shine-soft) a
// été retiré (effet "néon AI"). La card décolle maintenant par sa
// nuance de fond surface-3 (un cran au-dessus du form en surface-2),
// avec une border subtle white/10.

export interface PricingCardProps {
  className?: string;
}

const INCLUDED = [
  "Accès au dashboard expert",
  "Publication illimitée d'analyses",
  "Mise en avant dans les listings",
  "Paiements automatiques (80% pour toi)",
] as const;

export function PricingCard({ className }: PricingCardProps) {
  return (
    <div
      className={cn(
        // surface-3 + border-surface-4 visible : décollage marqué
        // du form (surface-2). v3 : la border passe à surface-4
        // (plus visible que white/10) pour que la card "détache"
        // vraiment du fond du form.
        "rounded-2xl border border-surface-4 bg-surface-3 p-6 md:p-7",
        className,
      )}
    >
      {/* Header : prix + label renouvellement à droite. items-baseline
          pour aligner le bas du "39€" avec le "Renouvellement…". */}
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

      {/* Divider neutre — sépare le prix des bénéfices. Espacement
          resserré (my-3 = 24px total) per règle "20-24px prix → bullets". */}
      <div aria-hidden className="my-3 h-px w-full bg-surface-3" />

      {/* Bullets : 4 inclusions avec check doré. gap-2.5 entre items
          pour une liste dense mais respirante. */}
      <ul className="space-y-2.5">
        {INCLUDED.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            {/* Check neutre — 4 checks dorés alignés diluaient l'accent
                qui doit rester réservé au prix "39€" en haut. */}
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
