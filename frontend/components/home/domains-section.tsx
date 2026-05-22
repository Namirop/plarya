"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DomainCard } from "@/components/domains/domain-card";
import { SectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

// Domaines disponibles pour le filtre in-page (cf. V1 logic retrouvée
// dans bae3a79 : `activeDomain` state, scroll vers #experts, useMemo
// filteredTipsters sur SPORT_DOMAIN / ESPORT_DOMAIN).
export type DomainId = "SPORT" | "ESPORT";

// 3 cards Figma frame `87:211` — voir domains-section-spec.md.
// Note : pas de lien "Voir tous les domaines" (acté avec le client :
// pas de sens avec seulement 3 domaines, cf. homepage-spec.md §3).
const DOMAINS = [
  {
    id: "SPORT" as DomainId,
    title: "SPORT",
    subtitle: "Football, Basketball, Tennis,\nMMA et plus",
    image: "/domains/sport.jpg",
    state: "active" as const,
  },
  {
    id: "ESPORT" as DomainId,
    title: "ESPORT",
    subtitle: "CS2, LoL, Valorant, Dota 2,\net plus",
    image: "/domains/esport.jpg",
    state: "active" as const,
  },
  {
    // Hippique = coming-soon, pas filtrable. id placeholder ignoré.
    id: null,
    title: "HIPPIQUE",
    subtitle: "Saut d'obstacles, Horseball",
    image: "/domains/hippique.jpg",
    state: "coming-soon" as const,
  },
];

// Width d'une card mobile + gap. Doit matcher les valeurs CSS de
// DomainCard mobile (w-[256px]) + le gap appliqué sur le scroller.
// Gap court (4 px) pour que les cards voisines collent presque à la
// card centrale (cf. ref Figma — gap quasi nul entre les 3 cards).
const MOBILE_CARD_GAP = 4;
const MOBILE_CARD_STEP = 256 + MOBILE_CARD_GAP;

export interface DomainsSectionProps {
  /** Domaine actuellement sélectionné comme filtre (state contrôlé par
   *  le parent — la page d'accueil). null = pas de filtre actif. */
  activeDomain?: DomainId | null;
  /** Callback déclenché au clic sur une DomainCard active. Le parent
   *  applique la toggle logic (re-cliquer sur le domaine actif le
   *  désélectionne) et le scroll vers la section experts. */
  onDomainSelect?: (domain: DomainId) => void;
}

export function DomainsSection({
  activeDomain = null,
  onDomainSelect,
}: DomainsSectionProps = {}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Index de la card "centrée" dans le carrousel mobile. Sert à
  // appliquer l'opacity 50 % aux voisines (effet focus + fade Figma).
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActive = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const idx = Math.round(scrollLeft / MOBILE_CARD_STEP);
    setActiveIndex(Math.max(0, Math.min(DOMAINS.length - 1, idx)));
  }, []);

  useEffect(() => {
    updateActive();
  }, [updateActive]);

  return (
    <section id="domains" className="pt-16">
      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        <SectionTitle title="Explore les domaines" />
      </div>

      {/* Mobile/tablette : carrousel snap-center full-bleed — les
          cards voisines doivent être coupées par le bord naturel de
          l'écran (pas par une ligne imaginaire intérieure), donc on
          sort de la grille max-w-content et on centre via 50vw.
          Desktop (lg) : on rentre dans le conteneur max-w-content. */}
      <div className="mx-auto w-full lg:max-w-content lg:px-0">
        <div
          ref={scrollerRef}
          onScroll={updateActive}
          className={cn(
            "mt-6 md:mt-10",
            "flex gap-1 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4",
            "px-[calc(50vw-128px)]",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            // Desktop : annule overflow + snap + padding. Gap-1 conservé
            // pour homogénéiser avec le mobile (cards quasi-collées).
            "lg:flex-wrap lg:items-center lg:justify-center lg:overflow-visible lg:pb-0 lg:px-0 lg:[scroll-snap-type:none]",
          )}
        >
          {DOMAINS.map((d, i) => (
            <div
              key={d.title}
              className={cn(
                "shrink-0 snap-center lg:shrink",
                "transition-all duration-300 ease-out origin-center",
                // Cards non-actives : réduites + désaturées en mobile,
                // taille pleine en desktop (3 visibles en parallèle).
                i !== activeIndex && "opacity-50 scale-[0.82]",
                "lg:opacity-100 lg:scale-100",
              )}
            >
              <DomainCard
                image={d.image}
                title={d.title}
                subtitle={d.subtitle}
                state={d.state}
                onClick={
                  d.id && onDomainSelect
                    ? () => onDomainSelect(d.id as DomainId)
                    : undefined
                }
                isSelected={d.id !== null && d.id === activeDomain}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* Dots de pagination — mobile only, sous le carrousel.
            Le user peut cliquer pour scroller à la card correspondante. */}
        <div className="lg:hidden mt-4 flex justify-center gap-2">
          {DOMAINS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller au domaine ${i + 1}`}
              onClick={() => {
                const el = scrollerRef.current;
                if (!el) return;
                el.scrollTo({ left: i * MOBILE_CARD_STEP, behavior: "smooth" });
              }}
              className={cn(
                "size-[8px] rounded-full transition-all duration-200 cursor-pointer",
                i === activeIndex
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
