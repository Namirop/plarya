"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { ExpertCard, type ExpertCardProps } from "@/components/experts/expert-card";
import { SectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

// Mocks de démo — à remplacer par un fetch /tipsters quand la page sera
// branchée sur l'API. Mix unlocked/locked pour montrer les 2 variants
// du bouton du bas. Avatars via pravatar (placeholder déterministe).
const EXPERTS_MOCK: (ExpertCardProps & { id: string })[] = [
  {
    id: "1",
    avatar: "https://i.pravatar.cc/68?u=plarya-1",
    pseudo: "MultiSport",
    viewsCount: 152,
    categories: ["FOOTBALL", "BASKETBALL", "MMA"],
    analyses: [
      { label: "Celtics - Knicks", isPickOfTheDay: true },
      { label: "UFC Fight Nights", isPickOfTheDay: false },
    ],
  },
  {
    id: "2",
    avatar: "https://i.pravatar.cc/68?u=plarya-2",
    pseudo: "EsportGuru",
    viewsCount: 218,
    categories: ["ESPORT"],
    analyses: [
      { label: "G2 - Fnatic", isPickOfTheDay: false },
      { label: "T1 - Gen.G", isPickOfTheDay: true },
    ],
    locked: true,
  },
  {
    id: "3",
    avatar: "https://i.pravatar.cc/68?u=plarya-3",
    pseudo: "TipsterPro",
    viewsCount: 84,
    categories: ["TENNIS", "FOOTBALL"],
    analyses: [
      { label: "Real Madrid - Barça", isPickOfTheDay: true },
      { label: "Alcaraz - Sinner", isPickOfTheDay: false },
    ],
  },
  {
    id: "4",
    avatar: "https://i.pravatar.cc/68?u=plarya-4",
    pseudo: "BasketKing",
    viewsCount: 271,
    categories: ["BASKETBALL"],
    analyses: [
      { label: "Lakers - Warriors", isPickOfTheDay: false },
      { label: "Bucks - Heat", isPickOfTheDay: false },
    ],
    locked: true,
  },
  {
    id: "5",
    avatar: "https://i.pravatar.cc/68?u=plarya-5",
    pseudo: "FootAnalyst",
    viewsCount: 63,
    categories: ["FOOTBALL", "RUGBY"],
    analyses: [
      { label: "PSG - OM", isPickOfTheDay: true },
      { label: "France - Irlande", isPickOfTheDay: false },
    ],
  },
  {
    id: "6",
    avatar: "https://i.pravatar.cc/68?u=plarya-6",
    pseudo: "CombatExpert",
    viewsCount: 197,
    categories: ["MMA", "BOXE"],
    analyses: [
      { label: "Jones - Aspinall", isPickOfTheDay: false },
      { label: "Fury - Joshua", isPickOfTheDay: true },
    ],
  },
];

// Mesures DS : card 322 px + gap 16 px → "step" = 338 px par card.
const CARD_WIDTH = 322;
const CARD_GAP = 16;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
// Cards visibles dans une "page" du carrousel. À 1175 px de container,
// 3 cards entières tiennent (3*322 + 2*16 = 998). On scroll donc par
// pages de 3 cards (= avance de 3 * CARD_STEP).
const CARDS_PER_PAGE = 3;

export function ExpertsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Nombre de "pages" = ceil(total / per_page). 6 cards / 3 = 2 pages,
  // mais on garde 3 dots dans la maquette → minimum 3 dots affichés.
  const totalPages = Math.max(
    3,
    Math.ceil(EXPERTS_MOCK.length / CARDS_PER_PAGE),
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

  useEffect(() => {
    updateState();
  }, [updateState]);

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

  return (
    // pt-24 = 96 px (gap depuis Domaines, = section-y-lg du Figma).
    <section className="pt-24">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <SectionTitle
          title="Nos experts du jour"
          cta={{ text: "Voir tous les experts", href: "/experts" }}
        />

        {/* Bloc carrousel — relative pour positionner le Next Btn en
            overlay top-right. mt-16 = 64 px (gap header → carrousel). */}
        <div className="relative mt-16">
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
            {EXPERTS_MOCK.map((expert) => (
              <div
                key={expert.id}
                className="shrink-0 snap-start"
                style={{ width: CARD_WIDTH }}
              >
                <ExpertCard
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
              "border border-accent-strong bg-surface-elevated text-accent",
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
            donc mt-[27px] = 35 px effectifs depuis le bas des cards. */}
        <div className="mt-[27px] flex justify-center gap-2">
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
