"use client";

import { useState } from "react";

import { FileText, Target, Calendar } from "@phosphor-icons/react";

import { AnalysesList } from "@/components/dashboard/analyses-list";
import { PublishAnalysisForm } from "@/components/dashboard/publish-analysis-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionTitle } from "@/components/ui/section-title";
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
      /* silent — comportement V1 conservé */
    }
  }

  function handlePublished(newProno: Prono, updatedProfile: ExpertProfile) {
    setPronos((prev) => [newProno, ...prev]);
    setProfile(updatedProfile);
  }

  // Stats computées côté client à partir de `pronos` (mapping V1).
  const now = new Date();
  const pronosThisMonth = pronos.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="mx-auto max-w-[872px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8 md:mb-16">
        <h1 className="font-body text-[28px] font-bold leading-tight text-foreground md:text-[36px]">
          {profile.pseudo}
        </h1>

        <div className="mt-6 flex flex-col gap-4 md:mt-8 md:flex-row">
          <StatCard icon={FileText} label="Analyses publiées" value={pronos.length} />
          <StatCard icon={Target} label="Taux de réussite" value={profile.winRate} suffix="%" />
          <StatCard icon={Calendar} label="Ce mois" value={pronosThisMonth} />
        </div>
      </div>

      <section className="mb-8 md:mb-16">
        <SectionTitle title="Publier une analyse" />
        <div className="mt-6 md:mt-8">
          <PublishAnalysisForm bookmakers={bookmakers} onPublished={handlePublished} />
        </div>
      </section>

      <section>
        <SectionTitle title={`Mes analyses (${pronos.length})`} />
        <div className="mt-6 md:mt-8">
          <AnalysesList pronos={pronos} onResult={handleResult} />
        </div>
      </section>
    </div>
  );
}
