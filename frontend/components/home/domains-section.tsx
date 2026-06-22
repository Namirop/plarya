"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { motion, type Variants } from "motion/react";

import { DomainCard } from "@/components/domains/domain-card";
import { MarketingSectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

// Reveal d'entrée : fondu + légère montée (PAS de scale). Le scale
// d'entrée (ancien pop-in bouncy) posait deux problèmes en prod :
//  1. animer le scale d'une DomainCard re-rasterise son image masquée
//     (mask-image) à chaque frame → freeze au scroll (pire à mesure
//     que les cards s'accumulent) ;
//  2. le scale décalait horizontalement les voisines pendant l'anim →
//     le "peek" de la 2e card disparaissait au tout premier affichage.
// Une montée verticale ne touche pas la position horizontale → le peek
// reste correct dès le départ, et l'opacity/translateY sont composités
// (pas de repaint coûteux).
const RISE_IN_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};
const RISE_IN_TRANSITION = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

// Domaines disponibles pour le filtre in-page : `activeDomain` state,
// scroll vers #experts, useMemo filteredExperts sur
// SPORT_DOMAIN / ESPORT_DOMAIN.
export type DomainId = "SPORT" | "ESPORT";

// 3 cards selon la maquette.
// Pas de lien "Voir tous les domaines" : la liste reste contenue à la
// home (décision produit — pas de sens avec seulement 3 domaines).
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
// DomainCard mobile (w-[272px]) + le gap appliqué sur le scroller.
// Gap court (4 px) pour que les cards voisines collent presque à la
// card centrale (cf. ref Figma — gap quasi nul entre les 3 cards).
const MOBILE_CARD_GAP = 4;
const MOBILE_CARD_WIDTH = 272;
const MOBILE_CARD_STEP = MOBILE_CARD_WIDTH + MOBILE_CARD_GAP;

export interface DomainsSectionProps {
  /** Domaine actuellement sélectionné comme filtre (state contrôlé par
   *  le parent — la page d'accueil). null = pas de filtre actif. */
  activeDomain?: DomainId | null;
  /** Callback déclenché au clic sur une DomainCard active. Le parent
   *  applique la toggle logic (re-cliquer sur le domaine actif le
   *  désélectionne) et le scroll vers la section experts. */
  onDomainSelect?: (domain: DomainId) => void;
}

export function DomainsSection({ activeDomain = null, onDomainSelect }: DomainsSectionProps = {}) {
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
        <MarketingSectionTitle title="Explore les domaines" />
      </div>

      {/* Mobile/tablette/lg : carrousel snap-center full-bleed — les
          cards voisines doivent être coupées par le bord naturel de
          l'écran (pas par une ligne imaginaire intérieure), donc on
          sort de la grille max-w-content et on centre via 50vw.
          Desktop (xl ≥ 1280) : grille 3-en-ligne dans max-w-content.
          On bascule au xl (et pas lg) car 3 cards × 360 + 2 gaps × 32
          = 1144px ne tient pas à coup sûr dans les viewports 1024-1175. */}
      <div className="mx-auto w-full xl:max-w-content xl:px-0">
        <div
          ref={scrollerRef}
          onScroll={updateActive}
          className={cn(
            "mt-6 md:mt-10",
            // pt-2 : réserve la place du glow doré (shadow-shine-soft)
            // quand la card est sélectionnée — sinon clipped en haut
            // par l'overflow-x du scroller.
            "flex gap-1 overflow-x-auto snap-x snap-mandatory scroll-smooth pt-2 pb-4",
            "px-[calc(50vw-136px)]",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            // xl : annule overflow + snap + padding. Gap mobile (4px) →
            // desktop (32px) : les 3 cards respirent en grille horizontale.
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
              {/* Focus mobile : voisines réduites (scale) + atténuées —
                  le scale recrée l'espacement et la "petite carte de côté"
                  voulus. Clé anti-freeze : on promeut l'élément sur sa
                  propre couche GPU (transform-gpu + will-change-transform)
                  pour que scaler l'image masquée des DomainCard se fasse
                  par transformation de texture (GPU) au lieu de re-
                  rastériser le masque à chaque frame (cause du freeze au
                  scroll). Élément interne distinct du motion.div pour ne
                  pas entrer en conflit avec le transform/opacity inline de
                  l'anim d'entrée. Desktop (xl) : grille 3-en-ligne, tout à
                  pleine taille/opacité. */}
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
                i === activeIndex ? "bg-foreground" : "bg-muted-foreground opacity-40 hover:opacity-70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
