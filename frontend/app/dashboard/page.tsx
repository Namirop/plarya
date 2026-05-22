"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/use-user";
import { apiGet, apiPatch } from "@/lib/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { PublishAnalysisForm } from "@/components/dashboard/publish-analysis-form";
import { AnalysesList } from "@/components/dashboard/analyses-list";
import { SectionTitle } from "@/components/ui/section-title";
import type {
  Bookmaker,
  Prono,
  ExpertProfile,
} from "@/lib/types/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [pronos, setPronos] = useState<Prono[]>([]);
  const [bookmakers, setBookmakers] = useState<Bookmaker[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, pronosData, bookmakersData] = await Promise.all([
        apiGet<ExpertProfile>("/experts/me"),
        apiGet<Prono[]>("/pronos/mine"),
        apiGet<Bookmaker[]>("/bookmakers"),
      ]);
      setProfile(profileData);
      setPronos(pronosData);
      setBookmakers(bookmakersData);
    } catch {
      /* redirect */
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    // ADMIN n'a pas de profil Expert en DB → `/experts/me` renvoie 404
    // et la page ne fonctionne pas. On le renvoie vers son panel admin
    // (où sa nav le menait déjà via le Header role-aware).
    if (user.role === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (user.role !== "EXPERT") {
      router.push("/");
      return;
    }
    fetchData();
  }, [user, loading, router, fetchData]);

  async function handleResult(pronoId: string, result: "WON" | "LOST") {
    try {
      const updated = await apiPatch<Prono>(`/pronos/${pronoId}/result`, {
        result,
      });
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? updated : p)));
      const profileData = await apiGet<ExpertProfile>("/experts/me");
      setProfile(profileData);
    } catch {
      /* silent */
    }
  }

  // Callback du form quand une analyse vient d'être publiée. Reproduit
  // le V1 (cf. ancien handlePublish lignes 169-181) : ajout au top de
  // la liste pronos + remplacement complet du profil.
  function handlePublished(newProno: Prono, updatedProfile: ExpertProfile) {
    setPronos((prev) => [newProno, ...prev]);
    setProfile(updatedProfile);
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-accent" />
      </div>
    );
  }

  // Stats computées côté client à partir de `pronos` (cf. dashboard-spec
  // §5 — les 3 cards Figma étaient toutes "RÉUSSITE 70%" placeholder ;
  // mapping décidé côté brief Bloc 1) :
  //   1. Analyses publiées : pronos.length (total V1)
  //   2. Taux de réussite : profile.winRate (V1, déjà calculé backend)
  //   3. Ce mois : pronos créés ce mois civil (computed ici, V1 n'expose
  //      pas un compteur mensuel via /experts/me)
  const now = new Date();
  const pronosThisMonth = pronos.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    // Container Dashboard : max-w 872px (cf. dashboard-spec §2),
    // mx-auto pour padding latéral symétrique. py-8 = 32px (multiples
    // de 8 partout, cf. notes designer).
    // Mobile : padding latéral 16px (px-4), reste compact (py-6).
    // Pas de footer sur cette page — géré par <SiteFooter /> via usePathname.
    <div className="mx-auto max-w-[872px] px-4 py-6 md:px-6 md:py-8">
      {/* Bloc identité + stats — affichés ensemble dès que le profil
          est chargé. Gap section → section = 32px mobile (mb-8),
          64px desktop (mb-16). */}
      {profile && (
        <div className="mb-8 md:mb-16">
          {/* Pseudo : DM Serif Display, taille calibrée plus petite en
              mobile (32/36) pour éviter le wrap horrible sur les longs
              pseudos. Desktop reste sur les valeurs Figma (48/60). */}
          <h1 className="font-display text-[32px] leading-[36px] text-foreground md:text-[48px] md:leading-[60px]">
            {profile.pseudo}
          </h1>

          {/* Stats : 3 cards en row desktop, stack vertical full-width
              mobile. flex-1 fonctionne dans les deux directions (row :
              largeur égale ; col : cards à hauteur naturelle, cross-axis
              stretch → full width). */}
          <div className="mt-6 flex flex-col gap-4 md:mt-8 md:flex-row">
            <StatCard
              icon="solar:document-text-bold"
              label="Analyses publiées"
              value={pronos.length}
            />
            <StatCard
              icon="ri:target-fill"
              label="Taux de réussite"
              value={profile.winRate}
              suffix="%"
            />
            <StatCard
              icon="solar:calendar-bold"
              label="Ce mois"
              value={pronosThisMonth}
            />
          </div>
        </div>
      )}

      {/* ─── Publish form (Bloc 2) ─── */}
      {/* Gap stats → titre section = 32px mobile, 64px desktop.
          Titre → form = 24px mobile (mt-6), 32px desktop (mt-8). */}
      <section className="mb-8 md:mb-16">
        <SectionTitle title="Publier une analyse" />
        <div className="mt-6 md:mt-8">
          <PublishAnalysisForm
            bookmakers={bookmakers}
            onPublished={handlePublished}
          />
        </div>
      </section>

      {/* ─── Mes analyses (Bloc 3) ─── */}
      <section>
        <SectionTitle title={`Mes analyses (${pronos.length})`} />
        <div className="mt-6 md:mt-8">
          <AnalysesList pronos={pronos} onResult={handleResult} />
        </div>
      </section>
    </div>
  );
}
