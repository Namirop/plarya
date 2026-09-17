"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion, type Variants } from "motion/react";

import { DomainCard } from "@/components/domains/domain-card";
import { MarketingSectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

// Entrée par fondu et montée, sans scale : animer le scale forcerait à
// re-rastériser l'image masquée à chaque frame et décalerait la carte voisine
// visible en bord d'écran. Opacité et translateY restent composités.
const RISE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};
const RISE_IN_TRANSITION = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

// Domaines filtrables dans la section experts (voir SPORT_DOMAIN / ESPORT_DOMAIN).
export type DomainId = "SPORT" | "ESPORT";

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
    // Domaine annoncé, non filtrable.
    id: null,
    title: "HIPPIQUE",
    subtitle: "Saut d'obstacles, Horseball",
    image: "/domains/hippique.jpg",
    state: "coming-soon" as const,
  },
];

// Doivent correspondre à la largeur mobile de DomainCard (w-[272px]) et au
// gap du carrousel (gap-1).
const MOBILE_CARD_GAP = 4;
const MOBILE_CARD_WIDTH = 272;
const MOBILE_CARD_STEP = MOBILE_CARD_WIDTH + MOBILE_CARD_GAP;

export interface DomainsSectionProps {
  /** Filtre contrôlé par la page ; null = aucun filtre. */
  activeDomain?: DomainId | null;
  /** Le parent gère la bascule (re-clic = désélection) et le défilement. */
  onDomainSelect?: (domain: DomainId) => void;
}

export function DomainsSection({ activeDomain = null, onDomainSelect }: DomainsSectionProps = {}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Carte centrée du carrousel mobile ; les voisines sont atténuées.
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
        <MarketingSectionTitle title="Explore les domaines" />
      </div>

      {/* Sous xl : carrousel pleine largeur, centré via 50vw, coupé par le
          bord de l'écran. À partir de xl : 3 cartes en ligne (1144 px ne
          tiennent pas toujours entre 1024 et 1175 px). */}
      <div className="mx-auto w-full xl:max-w-content xl:px-0">
        <div
          ref={scrollerRef}
          onScroll={updateActive}
          className={cn(
            "mt-6 md:mt-10",
            // pt-2 : place pour le halo de la carte sélectionnée, sinon
            // rogné par l'overflow du carrousel.
            "flex gap-1 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-2 pb-4",
            "px-[calc(50vw-136px)]",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            "xl:gap-8 xl:flex-nowrap xl:items-center xl:justify-center xl:overflow-visible xl:pb-0 xl:px-0 xl:[scroll-snap-type:none]",
          )}
        >
          {DOMAINS.map((d, i) => (
            <motion.div
              key={d.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={RISE_IN_VARIANTS}
              transition={{ ...RISE_IN_TRANSITION, delay: i * 0.1 }}
              className="shrink-0 snap-center"
            >
              {/* Voisines réduites et atténuées en mobile. Couche GPU dédiée
                  (will-change-transform) : le scale de l'image masquée reste
                  fluide au scroll. Élément distinct du motion.div pour ne pas
                  entrer en conflit avec l'animation d'entrée. */}
              <div
                className={cn(
                  "origin-center transform-gpu transition-[transform,opacity] duration-300 ease-out will-change-transform",
                  i !== activeIndex && "scale-[0.82] opacity-50",
                  "xl:scale-100 xl:opacity-100",
                )}
              >
                <DomainCard
                  image={d.image}
                  title={d.title}
                  subtitle={d.subtitle}
                  state={d.state}
                  onClick={
                    d.id && onDomainSelect ? () => onDomainSelect(d.id as DomainId) : undefined
                  }
                  isSelected={d.id !== null && d.id === activeDomain}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-content px-6 sm:px-8 lg:px-0">
        {/* Pagination cliquable du carrousel. */}
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
                  ? "bg-foreground"
                  : "bg-muted-foreground opacity-40 hover:opacity-70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
