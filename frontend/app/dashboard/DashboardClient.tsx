"use client";

import { useState } from "react";

import { AnalysesList } from "@/components/dashboard/analyses-list";
import { PublishAnalysisForm } from "@/components/dashboard/publish-analysis/publish-analysis-form";
import { SectionTitle } from "@/components/ui/section-title";
import { StatBlock } from "@/components/ui/stat-block";
import { apiGet, apiPatch } from "@/lib/api";
import type { Bookmaker, Prono, DashboardExpertStats } from "@/lib/types/dashboard";

interface DashboardClientProps {
  initialProfile: DashboardExpertStats;
  initialPronos: Prono[];
  initialBookmakers: Bookmaker[];
}

export default function DashboardClient({
  initialProfile,
  initialPronos,
  initialBookmakers,
}: DashboardClientProps) {
  // Données chargées côté serveur : pas de chargement initial côté client.
  const [profile, setProfile] = useState<DashboardExpertStats>(initialProfile);
  const [pronos, setPronos] = useState<Prono[]>(initialPronos);
  const [bookmakers] = useState<Bookmaker[]>(initialBookmakers);

  async function handleResult(pronoId: string, result: "WON" | "LOST") {
    try {
      const updated = await apiPatch<Prono>(`/pronos/${pronoId}/result`, {
        result,
      });
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? updated : p)));
      // Le taux de réussite dépend du résultat saisi.
      const profileData = await apiGet<DashboardExpertStats>("/experts/me");
      setProfile(profileData);
    } catch {
      /* échec silencieux : l'état affiché est conservé */
    }
  }

  function handlePublished(newProno: Prono, updatedProfile: DashboardExpertStats) {
    setPronos((prev) => [newProno, ...prev]);
    setProfile(updatedProfile);
  }

  const now = new Date();
  const pronosThisMonth = pronos.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto max-w-[872px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8 md:mb-16">
        <h1 className="font-body text-[32px] font-bold leading-tight text-foreground md:text-[56px]">
          {profile.pseudo}
        </h1>

        {/* Taux de réussite mis en avant en doré. */}
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
