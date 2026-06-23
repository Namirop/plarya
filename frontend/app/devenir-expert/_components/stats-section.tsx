import { Reveal } from "@/components/ui/reveal";
import { StatBlock } from "@/components/ui/stat-block";

// ════════════════ SECTION 2 — STATS FORTES ════════════════
// 3 mini-blocs "chiffre fort" SANS card ni border ni bg. Le pattern
// moderne (type-driven) : un GROS chiffre + label, sans décoration.
// Desktop : grid 3 cols égales avec dividers verticaux subtils.
// Mobile : stack vertical sans dividers.
export function StatsSection() {
  return (
    <section className="mx-auto mt-20 w-full max-w-content px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <Reveal delay={0}>
          <StatBlock
            value="Top 3"
            label="dans les listings de sport"
            description="Ton profil mis en avant sur la homepage et dans toutes les pages sport."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <StatBlock
            value="80%"
            valueAccent
            label="du chiffre d'affaires te revient"
            description="Day pass 3,50€, abonnement 29€/mois. Paiements automatiques mensuels."
            withLeftDivider
          />
        </Reveal>
        <Reveal delay={0.2}>
          <StatBlock
            value="30 sec"
            label="pour publier une analyse"
            description="Dashboard pensé pour les experts. Stats détaillées, suivi de tes résultats."
            withLeftDivider
          />
        </Reveal>
      </div>
    </section>
  );
}
