import { Fragment, type ComponentType } from "react";

import { User, LockOpen, CreditCard, type IconProps } from "@phosphor-icons/react";

import { DividerVertical } from "@/components/ui/divider-vertical";
import { cn } from "@/lib/utils";

type TrustItem = {
  icon: ComponentType<IconProps>;
  title: string;
  body: string;
};

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: User,
    title: "Analyses d'experts",
    body: "Des créateurs passionnés partagent leurs insights.",
  },
  {
    icon: LockOpen,
    title: "Contenu indépendant",
    body: "Des opinions libres, sans influence extérieure.",
  },
  {
    icon: CreditCard,
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
      <section className={cn("px-8 pt-12", className)}>
        <ul className="mx-auto flex max-w-content flex-col gap-8">
          {TRUST_ITEMS.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <item.icon size={24} className="shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1.5">
                <p className="font-body text-body-18 font-medium text-foreground">{item.title}</p>
                <p className="font-body text-[14px] leading-[1.4] text-muted-foreground">
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
    <ul className={cn("flex flex-col gap-10 sm:flex-row sm:items-center sm:gap-0", className)}>
      {TRUST_ITEMS.map((item, index) => (
        <Fragment key={item.title}>
          {index > 0 && <DividerVertical height={96} className="hidden sm:block" />}
          <li className="flex flex-1 items-start gap-[9px] sm:px-8">
            <item.icon size={30} className="shrink-0 text-muted-foreground" />
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
