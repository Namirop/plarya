import type { ComponentType } from "react";

import type { IconProps } from "@phosphor-icons/react";

export interface StatCardProps {
  /** Composant d'icône Phosphor passé par référence (tree-shaking). */
  icon: ComponentType<IconProps>;
  label: string;
  /** Accepte une chaîne, par exemple "—" pour un état vide. */
  value: number | string;
  /** Ex. "%". */
  suffix?: string;
}

// Carte d'indicateur des KPI de l'espace admin.
export function StatCard({ icon: Icon, label, value, suffix }: StatCardProps) {
  return (
    <div className="flex-1 rounded-2xl bg-black/40 p-6">
      <div className="flex items-center gap-2">
        <Icon className="size-6 text-muted-foreground" />
        <span className="font-body text-body-18 text-muted-foreground">{label}</span>
      </div>

      {/* tabular-nums : chiffres de largeur fixe, valeurs alignées entre cartes. */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-body text-[48px] font-bold leading-[60px] tabular-nums text-foreground">
          {value}
        </span>
        {suffix && <span className="font-body text-body-18 text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
