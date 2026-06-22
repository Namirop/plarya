import type { ComponentType } from "react";

import type { IconProps } from "@phosphor-icons/react";

export interface StatCardProps {
  /**
   * Composant icône Phosphor (ex: `Wallet`, `ChartLineUp`). Passé en
   * référence (pas en string) pour bénéficier du tree-shaking — chaque
   * page n'inclut dans son bundle que les icônes qu'elle utilise
   * réellement.
   */
  icon: ComponentType<IconProps>;
  /** Libellé en MAJUSCULES dans la maquette ; pas de transformation
   *  appliquée ici — passer la chaîne déjà capitalisée si voulu. */
  label: string;
  /** Valeur principale, gros nombre Mona Sans bold 48px + tabular-nums
   *  (aligne les colonnes de chiffres dans la grille de 3 stats). Number
   *  ou string (laisse "—" passer pour les états vides). */
  value: number | string;
  /** Suffixe optionnel à droite du nombre (ex: "%"). Texte muted 18px. */
  suffix?: string;
}

// Stat card Dashboard expert — bg-black/40 rounded-2xl 280×122. flex-1
// sur 3 cards alignées remplit le
// container 872px avec gap-4 (= 280×3 + 16×2 = 872, OK pile-poil).
export function StatCard({ icon: Icon, label, value, suffix }: StatCardProps) {
  return (
    <div className="flex-1 rounded-2xl bg-black/40 p-6">
      {/* Top row : icône dorée 24×24 + label muted. Gap 8px (cf.
          left=46-(14+24)=8 sur la maquette). */}
      <div className="flex items-center gap-2">
        <Icon className="size-6 text-muted-foreground" />
        <span className="font-body text-body-18 text-muted-foreground">{label}</span>
      </div>

      {/* Bottom row : gros nombre Mona Sans 48px bold + tabular-nums +
          suffixe muted 18px. tabular-nums maintient la largeur de chaque
          chiffre constante → les 3 cards alignent leurs valeurs même
          quand les nombres diffèrent (ex: 1, 12, 127). Aligne le baseline
          du suffixe avec celui du nombre via items-baseline. */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-body text-[48px] font-bold leading-[60px] tabular-nums text-foreground">
          {value}
        </span>
        {suffix && <span className="font-body text-body-18 text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
