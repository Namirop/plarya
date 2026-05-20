import { Icon } from "@iconify/react";

export interface StatCardProps {
  /** Identifiant d'icône Iconify (ex: "solar:document-text-bold"). */
  icon: string;
  /** Libellé en MAJUSCULES dans la maquette ; pas de transformation
   *  appliquée ici — passer la chaîne déjà capitalisée si voulu. */
  label: string;
  /** Valeur principale, gros nombre DM Serif 48px. Number ou string
   *  (laisse "—" passer pour les états vides). */
  value: number | string;
  /** Suffixe optionnel à droite du nombre (ex: "%"). Texte muted 18px. */
  suffix?: string;
}

// Stat card Dashboard expert — bg-black/40 rounded-2xl 280×122 selon
// `dashboard-spec.md §5`. flex-1 sur 3 cards alignées remplit le
// container 872px avec gap-4 (= 280×3 + 16×2 = 872, OK pile-poil).
export function StatCard({ icon, label, value, suffix }: StatCardProps) {
  return (
    <div className="flex-1 rounded-2xl bg-black/40 p-6">
      {/* Top row : icône dorée 24×24 + label muted. Gap 8px (cf.
          left=46-(14+24)=8 sur la maquette). */}
      <div className="flex items-center gap-2">
        <Icon icon={icon} className="size-6 text-accent" />
        <span className="font-body text-body-18 text-muted-foreground">
          {label}
        </span>
      </div>

      {/* Bottom row : gros nombre DM Serif 48px + suffixe muted 18px.
          Aligne le baseline du suffixe avec celui du nombre via items-baseline. */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-[48px] leading-[60px] text-foreground">
          {value}
        </span>
        {suffix && (
          <span className="font-body text-body-18 text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
