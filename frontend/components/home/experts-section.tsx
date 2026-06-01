"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react";

import { ExpertCard, type ExpertCardProps } from "@/components/experts/expert-card";
import type { DomainId } from "@/components/home/domains-section";
import { Button } from "@/components/ui/button";
import { MarketingSectionTitle } from "@/components/ui/section-title";
import { apiGet } from "@/lib/api";
import { allStarted } from "@/lib/date";
import { SPORT_DOMAIN, ESPORT_DOMAIN } from "@/lib/sports";
import { cn } from "@/lib/utils";

// Shape renvoyée par GET /experts (cf. backend/src/routes/experts.ts).
// On ne garde ici que ce qui sert à construire la card homepage.
interface ExpertListItem {
  id: string;
  pseudo: string;
  photoUrl: string | null;
  sports: string[];
  viewsToday: number;
  todayPronos: {
    matchName: string;
    isFeatured: boolean;
    startTime: string;
    result: "PENDING" | "WON" | "LOST";
  }[];
}

// Avatar fallback lorsqu'un expert n'a pas (encore) de photo.
const AVATAR_FALLBACK = "/profile.jpg";

// Mesures DS : card 322 px + gap 16 px → "step" = 338 px par card.
const CARD_WIDTH = 322;
const CARD_GAP = 16;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
// Cards visibles dans une "page" du carrousel desktop. À 1175 px de
// container, 3 cards entières tiennent (3*322 + 2*16 = 998). On scroll
// donc par pages de 3 cards (= avance de 3 * CARD_STEP).
const CARDS_PER_PAGE = 3;

export interface ExpertsSectionProps {
  /** Filtre domaine appliqué aux experts (cf. V1 logic retrouvée :
   *  filtre via SPORT_DOMAIN / ESPORT_DOMAIN constants de lib/sports).
   *  null = pas de filtre, tous les experts affichés. */
  filterDomain?: DomainId | null;
}

export function ExpertsSection({ filterDomain = null }: ExpertsSectionProps = {}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Carrousel mobile (swipe 1 card/vue, peek de la suivante) — ref +
  // index actif distincts du carrousel desktop.
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  // ── Fetch experts depuis l'API. /experts renvoie déjà la liste
  // triée par displayOrder ASC, createdAt DESC (limite 6 par défaut).
  // `loaded` distingue "en cours de fetch" (on n'affiche pas encore
  // l'état vide, pour éviter un flash) de "fetch terminé, 0 expert"
  // (on affiche alors le message d'état vide).
  const [experts, setExperts] = useState<(ExpertCardProps & { id: string })[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    apiGet<ExpertListItem[]>("/experts")
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
          // analyses PENDING du jour ont déjà commencé. allStarted()
          // renvoie aussi true pour une liste vide → un expert sans
          // analyse du jour apparaît en "Terminé".
          locked: allStarted(t.todayPronos.filter((p) => p.result === "PENDING")),
        }));
        setExperts(mapped);
      })
      .catch(() => setExperts([]))
      .finally(() => setLoaded(true));
  }, []);

  // Reproduction V1 (bae3a79 page.tsx) : filtre les experts par sports
  // appartenant au domaine sélectionné. SPORT regroupe tous les sports
  // physiques (FOOTBALL, TENNIS, BASKETBALL, etc.) ; ESPORT n'a qu'un
  // sport (ESPORT). Un expert match si AU MOINS UN de ses sports est
  // dans le domaine.
  const filteredExperts = useMemo(() => {
    if (!filterDomain) return experts;
    const domainSports = filterDomain === "SPORT" ? SPORT_DOMAIN : ESPORT_DOMAIN;
    return experts.filter((e) => e.categories.some((s) => domainSports.includes(s)));
  }, [experts, filterDomain]);

  const hasExperts = filteredExperts.length > 0;
  const isEmpty = loaded && !hasExperts;

  // Nombre de "pages" = ceil(total / per_page). Minimum 1 pour éviter
  // un render à 0 dots quand la liste est encore vide (fetch initial).
  const totalPages = Math.max(1, Math.ceil(filteredExperts.length / CARDS_PER_PAGE));

  const updateState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const pageWidth = CARD_STEP * CARDS_PER_PAGE;
    const page = pageWidth > 0 ? Math.round(scrollLeft / pageWidth) : 0;
    setActivePage(Math.min(page, totalPages - 1));
    // Considérer "fin" avec une marge de 2 px pour absorber les
    // imprécisions de scroll-snap / subpixel rounding.
    setIsAtEnd(scrollLeft >= maxScroll - 2);
  }, [totalPages]);

  // Recompute scroll state quand le scroller change : à l'hydratation
  // ET quand les experts arrivent du fetch API (sans ce 2ᵉ trigger,
  // `isAtEnd` reste à `true` car maxScroll = scrollWidth(0) -
  // clientWidth = très négatif au mount initial → flèche désactivée).
  // useLayoutEffect : on mesure le DOM (scrollWidth / clientWidth) puis
  // on set le state avant le paint → évite le flash "flèche disabled"
  // pendant 1 frame.
  useLayoutEffect(() => {
    if (!hasExperts) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateState();
  }, [updateState, filteredExperts, hasExperts]);

  const scrollToPage = useCallback((page: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({
      left: page * CARD_STEP * CARDS_PER_PAGE,
      behavior: "smooth",
    });
  }, []);

  const handleNext = useCallback(() => {
    if (isAtEnd) return;
    scrollToPage(activePage + 1);
  }, [activePage, isAtEnd, scrollToPage]);

  // ── Carrousel mobile : step = largeur d'une card (mesurée) + gap.
  const mobileStep = useCallback(() => {
    const el = mobileScrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + CARD_GAP : el?.clientWidth || 1;
  }, []);

  const updateMobileState = useCallback(() => {
    const el = mobileScrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / mobileStep());
    setMobileIndex(Math.max(0, Math.min(idx, filteredExperts.length - 1)));
  }, [mobileStep, filteredExperts.length]);

  const scrollMobileTo = useCallback(
    (i: number) => {
      const el = mobileScrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: i * mobileStep(), behavior: "smooth" });
    },
    [mobileStep],
  );

  return (
    // pt-24 = 96 px (gap depuis Domaines, = section-y-lg du Figma).
    <section id="experts" className="pt-16 md:pt-24">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* CTA top-right masqué en mobile : remplacé par le bouton plein
            largeur sous le carrousel (spec mobile §5). Masqué aussi quand
            la section est vide (le CTA vit alors dans l'état vide). */}
        <MarketingSectionTitle
          title="Nos experts du jour"
          cta={{ text: "Voir tous les experts", href: "/experts" }}
          ctaClassName={cn("hidden md:inline-flex", isEmpty && "md:hidden")}
        />

        {isEmpty ? (
          // ──────── État vide : message + CTA, pas de carrousel/dots ────────
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-surface-elevated bg-black/40 px-6 py-14 text-center">
            <p className="font-body text-body-18 font-bold text-foreground">
              Pas encore d&apos;analyse pour aujourd&apos;hui
            </p>
            <p className="mt-2 max-w-md font-body text-body-16 text-muted-foreground">
              Nos experts publient leurs sélections au fil de la journée. Reviens un peu plus tard,
              ou explore leurs profils.
            </p>
            <Button
              variant="secondary"
              size="lg"
              render={<Link href="/experts" />}
              className="mt-7 border-white hover:border-white"
            >
              Voir tous les experts
            </Button>
          </div>
        ) : hasExperts ? (
          <>
            {/* ──────── Mobile : carrousel swipe ──────── */}
            <div className="md:hidden mt-6">
              <div
                ref={mobileScrollerRef}
                onScroll={updateMobileState}
                className={cn(
                  "flex gap-4 overflow-x-auto pb-1",
                  "snap-x snap-mandatory scroll-smooth",
                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                )}
              >
                {filteredExperts.map((expert) => (
                  // w-[86%] : peek de la card suivante → signale le swipe.
                  // max-w-[322px] : ne dépasse pas la largeur DS de la card.
                  <div
                    key={expert.id}
                    className="shrink-0 snap-start w-[86%] max-w-[322px]"
                  >
                    <ExpertCard
                      id={expert.id}
                      avatar={expert.avatar}
                      pseudo={expert.pseudo}
                      viewsCount={expert.viewsCount}
                      categories={expert.categories}
                      analyses={expert.analyses}
                      locked={expert.locked}
                    />
                  </div>
                ))}
              </div>

              {/* Dots mobile — un par expert. */}
              {filteredExperts.length > 1 && (
                <div className="mt-5 flex justify-center gap-2">
                  {filteredExperts.map((expert, i) => (
                    <button
                      key={expert.id}
                      type="button"
                      onClick={() => scrollMobileTo(i)}
                      aria-label={`Aller à l'expert ${i + 1}`}
                      className={cn(
                        "size-[10px] rounded-full transition-all duration-200 cursor-pointer",
                        i === mobileIndex
                          ? "bg-foreground"
                          : "bg-muted-foreground opacity-40 hover:opacity-70",
                      )}
                    />
                  ))}
                </div>
              )}

              {/* CTA plein largeur vers la page experts complète. */}
              <div className="mt-7 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  render={<Link href="/experts" />}
                  className="w-full max-w-[353px] border-white hover:border-white"
                >
                  Voir tous les experts
                </Button>
              </div>
            </div>

            {/* ──────── Desktop : carrousel ──────── */}
            <div className="hidden md:block relative mt-10">
              <div
                ref={scrollerRef}
                onScroll={updateState}
                className={cn(
                  "flex gap-4 overflow-x-auto pb-2",
                  "snap-x snap-mandatory scroll-smooth",
                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                )}
              >
                {filteredExperts.map((expert) => (
                  <div key={expert.id} className="shrink-0 snap-start" style={{ width: CARD_WIDTH }}>
                    <ExpertCard
                      id={expert.id}
                      avatar={expert.avatar}
                      pseudo={expert.pseudo}
                      viewsCount={expert.viewsCount}
                      categories={expert.categories}
                      analyses={expert.analyses}
                      locked={expert.locked}
                    />
                  </div>
                ))}
              </div>

              {/* Next button — overlay top-right, vertical-centré sur les
                  cards. Masqué quand tout tient déjà (1 page). */}
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isAtEnd}
                  aria-label="Voir les experts suivants"
                  className={cn(
                    "absolute top-[188px] right-[-22px] flex size-[45px] items-center justify-center rounded-full",
                    "border border-surface-elevated bg-background text-foreground",
                    "transition-all duration-200 ease-out cursor-pointer",
                    "hover:bg-white/[0.04] hover:border-foreground/30",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none disabled:hover:shadow-none",
                  )}
                >
                  <ArrowRight className="size-5" strokeWidth={1.5} />
                </button>
              )}

              {/* Dots — centrés, 35 px sous les cards. Affichés s'il y a
                  plus d'une page. */}
              {totalPages > 1 && (
                <div className="flex mt-[27px] justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToPage(i)}
                      aria-label={`Aller à la page ${i + 1}`}
                      className={cn(
                        "size-[10px] rounded-full transition-all duration-200 cursor-pointer",
                        i === activePage
                          ? "bg-foreground"
                          : "bg-muted-foreground opacity-40 hover:opacity-70",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
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
