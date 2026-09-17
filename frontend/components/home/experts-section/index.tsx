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

// Avatar par défaut d'un expert sans photo.
const AVATAR_FALLBACK = "/profile.jpg";

export interface ExpertsSectionProps {
  /** null = tous les experts. */
  filterDomain?: DomainId | null;
}

export function ExpertsSection({ filterDomain = null }: ExpertsSectionProps = {}) {
  // `loaded` distingue le chargement (pas d'état vide affiché) d'une liste vide.
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
          // « Terminé » quand toutes les analyses en attente ont commencé,
          // ou quand il n'y en a aucune.
          locked: allStarted(t.todayPronos.filter((p) => p.result === "PENDING")),
        }));
        setExperts(mapped);
      })
      .catch(() => setExperts([]))
      .finally(() => setLoaded(true));
  }, []);

  // Un expert est retenu si au moins un de ses sports relève du domaine.
  const filteredExperts = useMemo(() => {
    if (!filterDomain) return experts;
    const domainSports = filterDomain === "SPORT" ? SPORT_DOMAIN : ESPORT_DOMAIN;
    return experts.filter((e) => e.categories.some((s) => domainSports.includes(s)));
  }, [experts, filterDomain]);

  const hasExperts = filteredExperts.length > 0;
  const isEmpty = loaded && !hasExperts;

  return (
    <section id="experts" className="pt-16 md:pt-24">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <MarketingSectionTitle title="Nos experts du jour" />

        {isEmpty ? (
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
          // Réserve la hauteur pendant le chargement (limite le décalage de mise en page).
          <div className="min-h-[260px]" aria-hidden />
        )}
      </div>
    </section>
  );
}
