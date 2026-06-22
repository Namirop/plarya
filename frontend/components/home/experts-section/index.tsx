"use client";

import { useEffect, useMemo, useState } from "react";

import type { ExpertCardProps } from "@/components/experts/expert-card";
import type { DomainId } from "@/components/home/domains-section";
import { MarketingSectionTitle } from "@/components/ui/section-title";
import { apiGet } from "@/lib/api";
import { allStarted } from "@/lib/date";
import { SPORT_DOMAIN, ESPORT_DOMAIN } from "@/lib/sports";
import type { ExpertListItem } from "@/lib/types/expert";

import { DesktopCarousel } from "./desktop-carousel";
import { MobileCarousel } from "./mobile-carousel";

// Avatar fallback lorsqu'un expert n'a pas (encore) de photo.
const AVATAR_FALLBACK = "/profile.jpg";

export interface ExpertsSectionProps {
  /** Filtre domaine appliqué aux experts (filtre via
   *  SPORT_DOMAIN / ESPORT_DOMAIN constants de lib/sports).
   *  null = pas de filtre, tous les experts affichés. */
  filterDomain?: DomainId | null;
}

export function ExpertsSection({ filterDomain = null }: ExpertsSectionProps = {}) {
  // `?all=true` → TOUS les experts (triés displayOrder ASC, createdAt
  // DESC). `loaded` distingue "fetch en cours" (pas d'état vide, évite
  // un flash) de "fetch terminé, 0 expert" (on affiche l'état vide).
  const [experts, setExperts] = useState<(ExpertCardProps & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet<ExpertListItem[]>("/experts?all=true")
      .then((data) => {
        const mapped = data.map<ExpertCardProps & { id: string }>((t) => ({
          id: t.id,
          avatar: t.photoUrl || AVATAR_FALLBACK,
          pseudo: t.pseudo,
          viewsCount: t.viewsToday,
          categories: t.sports,
          analyses: t.todayPronos.map((p) => ({
            label: p.matchName,
            isPickOfTheDay: p.isFeatured,
          })),
          // `locked` (= "Terminé pour aujourd'hui") quand toutes les
          // analyses PENDING du jour ont commencé. allStarted() renvoie
          // aussi true pour une liste vide → expert sans analyse =
          // "Terminé".
          locked: allStarted(t.todayPronos.filter((p) => p.result === "PENDING")),
        }));
        setExperts(mapped);
      })
      .catch(() => setExperts([]))
      .finally(() => setLoaded(true));
  }, []);

  // Filtre par domaine : un expert match si AU MOINS UN de ses sports
  // appartient au domaine sélectionné.
  const filteredExperts = useMemo(() => {
    if (!filterDomain) return experts;
    const domainSports = filterDomain === "SPORT" ? SPORT_DOMAIN : ESPORT_DOMAIN;
    return experts.filter((e) => e.categories.some((s) => domainSports.includes(s)));
  }, [experts, filterDomain]);

  const hasExperts = filteredExperts.length > 0;
  const isEmpty = loaded && !hasExperts;

  return (
    // pt-24 = 96 px (gap depuis Domaines, = section-y-lg de la maquette).
    <section id="experts" className="pt-16 md:pt-24">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <MarketingSectionTitle title="Nos experts du jour" />

        {isEmpty ? (
          // ─── État vide : message + CTA, pas de carrousel/dots ───
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-surface-elevated bg-black/40 px-6 py-14 text-center">
            <p className="font-body text-body-18 font-bold text-foreground">
              Pas encore d&apos;analyse pour aujourd&apos;hui
            </p>
            <p className="mt-2 max-w-md font-body text-body-16 text-muted-foreground">
              Nos experts publient leurs sélections au fil de la journée. Reviens un peu plus tard,
              ou explore leurs profils.
            </p>
          </div>
        ) : hasExperts ? (
          <>
            <MobileCarousel experts={filteredExperts} />
            <DesktopCarousel experts={filteredExperts} />
          </>
        ) : (
          // Pendant le fetch initial : placeholder pour limiter le layout
          // shift (pas de message "vide" tant que loaded === false).
          <div className="min-h-[260px]" aria-hidden />
        )}
      </div>
    </section>
  );
}
