"use client";

import { useState } from "react";

import { AnalysesList } from "@/components/dashboard/analyses-list";
import { PublishAnalysisForm } from "@/components/dashboard/publish-analysis/publish-analysis-form";
import { SectionTitle } from "@/components/ui/section-title";
import { StatBlock } from "@/components/ui/stat-block";
import { apiGet, apiPatch } from "@/lib/api";
import type { Bookmaker, Prono, ExpertProfile } from "@/lib/types/dashboard";

interface DashboardClientProps {
  initialProfile: ExpertProfile;
  initialPronos: Prono[];
  initialBookmakers: Bookmaker[];
}

export default function DashboardClient({
  initialProfile,
  initialPronos,
  initialBookmakers,
}: DashboardClientProps) {
  // States initialisés depuis les data server — pas de fetch initial
  // côté client, pas de spinner au mount.
  const [profile, setProfile] = useState<ExpertProfile>(initialProfile);
  const [pronos, setPronos] = useState<Prono[]>(initialPronos);
  // Bookmakers : peu utiles à muter (set au mount, jamais re-fetché)
  // mais on garde un state pour pouvoir le rafraîchir si on en ajoute
  // un patch admin → dashboard plus tard.
  const [bookmakers] = useState<Bookmaker[]>(initialBookmakers);

  async function handleResult(pronoId: string, result: "WON" | "LOST") {
    try {
      const updated = await apiPatch<Prono>(`/pronos/${pronoId}/result`, {
        result,
      });
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? updated : p)));
      // Refresh winRate qui dépend de l'override.
      const profileData = await apiGet<ExpertProfile>("/experts/me");
      setProfile(profileData);
    } catch {
      /* silent — échec non-bloquant, on garde l'état courant */
    }
  }

  function handlePublished(newProno: Prono, updatedProfile: ExpertProfile) {
    setPronos((prev) => [newProno, ...prev]);
    setProfile(updatedProfile);
  }

  // Stats computées côté client à partir de `pronos`.
  const now = new Date();
  const pronosThisMonth = pronos.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto max-w-[872px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8 md:mb-16">
        {/* Pseudo en H1 — gabarit poussé (32 → 56px) pour qu'il
            domine clairement la zone stats qui suit. C'est l'identité
            de l'expert sur sa page d'admin, ça doit être affirmé. */}
        <h1 className="font-body text-[32px] font-bold leading-tight text-foreground md:text-[56px]">
          {profile.pseudo}
        </h1>

        {/* Stats : variante compact du StatBlock (gabarit + padding
            réduits). Win rate en doré. Dividers verticaux desktop. */}
        <div className="mt-4 grid grid-cols-1 md:mt-6 md:grid-cols-3">
          <StatBlock
            compact
            value={pronos.length.toString()}
            label="Analyses publiées"
            description="Total cumulé depuis ton inscription sur Plarya."
          />
          <StatBlock
            compact
            value={`${profile.winRate}%`}
            label="Taux de réussite"
            description="Calculé sur tes 10 dernières analyses validées."
            valueAccent
            withLeftDivider
          />
          <StatBlock
            compact
            value={pronosThisMonth.toString()}
            label="Ce mois-ci"
            description="Nombre d'analyses publiées ce mois calendaire."
            withLeftDivider
          />
        </div>
      </div>

      <section className="mb-8 md:mb-16">
        <SectionTitle title="Publier une analyse" />
        <div className="mt-6 md:mt-8">
          <PublishAnalysisForm bookmakers={bookmakers} onPublished={handlePublished} />
        </div>
      </section>

      <section>
        <SectionTitle title={`Mes analyses`} />
        <div className="mt-6 md:mt-8">
          <AnalysesList pronos={pronos} onResult={handleResult} />
        </div>
      </section>
    </div>
  );
}
