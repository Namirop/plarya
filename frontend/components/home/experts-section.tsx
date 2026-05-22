"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExpertCard, type ExpertCardProps } from "@/components/experts/expert-card";
import { SectionTitle } from "@/components/ui/section-title";
import { SPORT_DOMAIN, ESPORT_DOMAIN } from "@/lib/sports";
import type { DomainId } from "@/components/home/domains-section";
import { apiGet } from "@/lib/api";
import { allStarted } from "@/lib/date";
import { cn } from "@/lib/utils";

// Shape renvoyée par GET /tipsters (cf. backend/src/routes/tipsters.ts).
// On ne garde ici que ce qui sert à construire la card homepage.
interface TipsterListItem {
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

// Avatar fallback lorsqu'un tipster n'a pas (encore) de photo.
const AVATAR_FALLBACK = "/profile.jpg";

// Mesures DS : card 322 px + gap 16 px → "step" = 338 px par card.
const CARD_WIDTH = 322;
const CARD_GAP = 16;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
// Cards visibles dans une "page" du carrousel. À 1175 px de container,
// 3 cards entières tiennent (3*322 + 2*16 = 998). On scroll donc par
// pages de 3 cards (= avance de 3 * CARD_STEP).
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

  // ── Fetch tipsters depuis l'API. /tipsters renvoie déjà la liste
  // triée par displayOrder ASC, createdAt DESC (limite 6 par défaut).
  // Les `id` réels permettent au Link de la card de naviguer vers la
  // page profil (`/tipsters/[id]`) sans 404 — c'était l'objet du fix
  // qui remplace les anciens mocks codés en dur (id "1" → "6"). En cas
  // d'erreur réseau, on garde la liste vide (la section ne s'affiche
  // pas en dessous des dots).
  const [experts, setExperts] = useState<(ExpertCardProps & { id: string })[]>(
    [],
  );
  useEffect(() => {
    apiGet<TipsterListItem[]>("/tipsters")
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
          // renvoie aussi true pour une liste vide → un tipster sans
          // analyse du jour apparaît en "Terminé".
          locked: allStarted(
            t.todayPronos.filter((p) => p.result === "PENDING"),
          ),
        }));
        setExperts(mapped);
      })
      .catch(() => setExperts([]));
  }, []);

  // Reproduction V1 (bae3a79 page.tsx) : filtre les experts par sports
  // appartenant au domaine sélectionné. SPORT regroupe tous les sports
  // physiques (FOOTBALL, TENNIS, BASKETBALL, etc.) ; ESPORT n'a qu'un
  // sport (ESPORT). Un expert match si AU MOINS UN de ses sports est
  // dans le domaine.
  const filteredExperts = useMemo(() => {
    if (!filterDomain) return experts;
    const domainSports =
      filterDomain === "SPORT" ? SPORT_DOMAIN : ESPORT_DOMAIN;
    return experts.filter((e) =>
      e.categories.some((s) => domainSports.includes(s)),
    );
  }, [experts, filterDomain]);

  // Nombre de "pages" = ceil(total / per_page). Minimum 1 pour éviter
  // un render à 0 dots quand la liste est encore vide (fetch initial).
  const totalPages = Math.max(
    1,
    Math.ceil(filteredExperts.length / CARDS_PER_PAGE),
  );

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
  useEffect(() => {
    updateState();
  }, [updateState, filteredExperts]);

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

  // 2 premières cards en mobile : stack vertical conformément à la spec
  // mobile (vs carrousel de 6 en desktop). Le slice s'applique sur la
  // liste filtrée pour que le filtre domaine ait un effet visible en
  // mobile aussi.
  const MOBILE_EXPERTS = filteredExperts.slice(0, 2);

  return (
    // pt-24 = 96 px (gap depuis Domaines, = section-y-lg du Figma).
    <section id="experts" className="pt-16 md:pt-24">
      <div className="mx-auto w-full max-w-content px-4 sm:px-8 lg:px-0">
        {/* CTA top-right masqué en mobile : remplacé par le bouton plein
            largeur sous les cards (spec mobile §5). */}
        <SectionTitle
          title="Nos experts du jour"
          cta={{ text: "Voir tous les experts", href: "/experts" }}
          ctaClassName="hidden md:inline-flex"
        />

        {/* ──────── Mobile : stack vertical de 2 cards + bouton ──────── */}
        <div className="md:hidden mt-6 flex flex-col items-center gap-4">
          {MOBILE_EXPERTS.map((expert) => (
            <ExpertCard
              key={expert.id}
              id={expert.id}
              avatar={expert.avatar}
              pseudo={expert.pseudo}
              viewsCount={expert.viewsCount}
              categories={expert.categories}
              analyses={expert.analyses}
              locked={expert.locked}
            />
          ))}

          {/* Bouton "Voir tous les experts" — outline blanc, plein
              largeur de la card (353 px ≈ 360-7), conforme à la spec
              mobile §5 (bouton 353×51 px=72 py=16). */}
          <Button
            variant="secondary"
            size="lg"
            render={<Link href="/experts" />}
            className="w-full max-w-[353px] border-white hover:border-white"
          >
            Voir tous les experts
          </Button>
        </div>

        {/* ──────── Desktop : carrousel original ──────── */}
        {/* Bloc carrousel — relative pour positionner le Next Btn en
            overlay top-right. mt-10 = 40 px (gap header → carrousel,
            rapproché du SectionTitle vs 64 px précédent). */}
        <div className="hidden md:block relative mt-10">
          <div
            ref={scrollerRef}
            onScroll={updateState}
            className={cn(
              "flex gap-4 overflow-x-auto pb-2",
              // Scroll-snap par card pour un alignement propre quand on
              // scroll manuellement (drag / wheel / clavier).
              "snap-x snap-mandatory scroll-smooth",
              // Cache la scrollbar visuelle, l'interaction reste OK.
              "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {filteredExperts.map((expert) => (
              <div
                key={expert.id}
                className="shrink-0 snap-start"
                style={{ width: CARD_WIDTH }}
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

          {/* Next button — overlay top-right, vertical-centré sur les
              cards (~211 px = 422/2). Positionné légèrement à
              l'extérieur du conteneur (right -22 px) pour matcher le
              chevauchement subtil de la maquette sur la 4ᵉ card. */}
          <button
            type="button"
            onClick={handleNext}
            disabled={isAtEnd}
            aria-label="Voir les experts suivants"
            className={cn(
              "absolute top-[188px] right-[-22px] flex size-[45px] items-center justify-center rounded-full",
              // bg-background (#000 solide) pour que le bouton "tienne"
              // visuellement au-dessus du fond #131212 — vs
              // bg-surface-elevated qui se confondait avec le bg de la
              // page et donnait une impression de transparence.
              "border border-accent-strong bg-background text-accent",
              "transition-all duration-200 ease-out cursor-pointer",
              "hover:shadow-shine hover:border-accent",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none disabled:hover:shadow-none",
            )}
          >
            <ArrowRight className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Dots — centrés horizontalement, 35 px sous les cards (cf.
            experts-section-spec.md §5). pb-2 du scroller donne déjà 8 px,
            donc mt-[27px] = 35 px effectifs depuis le bas des cards.
            Desktop-only : alignés avec le carrousel ci-dessus. */}
        <div className="hidden md:flex mt-[27px] justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToPage(i)}
              aria-label={`Aller à la page ${i + 1}`}
              className={cn(
                "size-[10px] rounded-full transition-all duration-200 cursor-pointer",
                i === activePage
                  ? "bg-accent"
                  : "bg-muted-foreground opacity-40 hover:opacity-70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
