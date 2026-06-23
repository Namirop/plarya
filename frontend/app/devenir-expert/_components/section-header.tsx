// Eyebrow uppercase commun (Form & FAQ). Tracking large pour un
// rendu moderne, font-semibold pour du poids sans crier.
export const eyebrowCls =
  "font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

// Pré-titre + titre + sous-titre — pattern partagé entre Section 3
// (Form) et Section 4 (FAQ). Centré, padding-bottom homogène.
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      {/* Kicker → Titre : 12px (mt-3) — élément lié, gap proportionné
          à la nouvelle taille XL du titre. */}
      <p className={eyebrowCls}>{eyebrow}</p>
      {/* H2 XL : mobile 36px, desktop 56px (vs 28-32 ancien). Le
          contraste éditorial vient du gabarit, pas de la couleur. */}
      <h2 className="mt-3 font-body text-[36px] font-bold leading-[1.02] text-foreground md:text-[56px]">
        {title}
      </h2>
      {/* Titre → sous-titre : 16px (mt-4) — gap d'une unité visuelle. */}
      {subtitle && (
        <p className="mx-auto mt-4 max-w-[560px] font-body text-body-16 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
