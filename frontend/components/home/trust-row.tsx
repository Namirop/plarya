import { Fragment } from "react";
import { Icon } from "@iconify/react";

import { DividerVertical } from "@/components/ui/divider-vertical";
import { cn } from "@/lib/utils";

const TRUST_ITEMS = [
  {
    icon: "solar:user-outline",
    title: "Analyses d'experts",
    body: "Des créateurs passionnés partagent leurs insights.",
  },
  {
    icon: "stash:lock-opened",
    title: "Contenu indépendant",
    body: "Des opinions libres, sans influence extérieure.",
  },
  {
    icon: "f7:creditcard",
    title: "Paiement sécurisé",
    body: "Accès simple et rapide à chaque analyse.",
  },
];

type TrustRowProps = {
  // `inline` : rendu à l'intérieur du Hero (rangée, dividers verticaux).
  // `standalone` : bloc indépendant (mobile only sur la home, cf.
  // page.tsx — 3 items stackés verticalement).
  variant?: "inline" | "standalone";
  className?: string;
};

export function TrustRow({ variant = "inline", className }: TrustRowProps) {
  if (variant === "standalone") {
    return (
      <section className={cn("px-6 pt-12", className)}>
        <ul className="mx-auto flex max-w-content flex-col gap-10">
          {TRUST_ITEMS.map((item) => (
            <li key={item.title} className="flex items-start gap-[9px]">
              <Icon
                icon={item.icon}
                width={30}
                height={30}
                className="shrink-0 text-accent"
              />
              <div className="flex flex-col gap-2">
                <p className="font-body text-h5 text-foreground">
                  {item.title}
                </p>
                <p className="font-body text-body-16 leading-[1.4] text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <ul
      className={cn(
        "flex flex-col gap-10 sm:flex-row sm:items-center sm:gap-0",
        className,
      )}
    >
      {TRUST_ITEMS.map((item, index) => (
        <Fragment key={item.title}>
          {index > 0 && (
            <DividerVertical height={96} className="hidden sm:block" />
          )}
          <li className="flex flex-1 items-start gap-[9px] sm:px-8">
            <Icon
              icon={item.icon}
              width={30}
              height={30}
              className="shrink-0 text-accent"
            />
            <div className="flex flex-col gap-2">
              <p className="font-body text-h5 text-foreground">{item.title}</p>
              <p className="font-body text-body-16 leading-[1.4] text-muted-foreground">
                {item.body}
              </p>
            </div>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
