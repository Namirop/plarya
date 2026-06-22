import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mask appliqué sur l'image elle-même (mode alpha, comme dans la spec
// Figma `mask-alpha`). L'image devient transparente sur sa moitié basse,
// donc le fond de page apparaît directement à travers — fade plus subtil
// qu'un overlay coloré (qui peignait par-dessus avec une couleur plate).
// Stops calibrés sur Figma : image opaque jusqu'à ~40 %, fade jusqu'à
// ~75 %, totalement transparent en bas (= zone titre/sous-titre/bouton).
const IMAGE_FADE_MASK = "linear-gradient(to bottom, black 0%, black 40%, transparent 75%)";

export interface DomainCardProps {
  image: string;
  title: string;
  /** Peut contenir un `\n` pour forcer un saut de ligne (cf. Sport / Esport en 2 lignes). */
  subtitle: string;
  state?: "active" | "coming-soon";
  /** Lien de destination (legacy, encore utilisé par /test-domain-card).
   *  Ignoré si `onClick` est fourni ou si state="coming-soon". */
  href?: string;
  /** Handler de clic — prioritaire sur `href`. Utilisé par la homepage
   *  pour piloter le filtre in-page de la section experts (state
   *  `activeDomain` côté page, scroll vers `#experts`). */
  onClick?: () => void;
  /** Card actuellement sélectionnée (= ce domaine filtre la section
   *  experts). Sert d'indication visuelle quand on a un filtre actif. */
  isSelected?: boolean;
}

export function DomainCard({
  image,
  title,
  subtitle,
  state = "active",
  href,
  onClick,
  isSelected = false,
}: DomainCardProps) {
  const isComingSoon = state === "coming-soon";
  const displayedSubtitle = isComingSoon ? "Arrive bientôt" : subtitle;

  const card = (
    // Wrapper extérieur `group` : source du hover propagé (lift, zoom
    // image, shadow noire sous la card). Pas de transform direct ici —
    // tout est porté par les enfants pour que la shadow noire (qui sort
    // du rounded de la card) ne soit pas clipped par overflow-hidden.
    <div className={cn("group relative", !isComingSoon && "transition-all duration-500 ease-out")}>
      {/* Shadow noire sous la card au hover (= v1 page.tsx) — ellipse
          large floutée qui apparaît derrière la card et lui donne du
          poids. Hidden au repos (bg-black/0), visible au hover desktop. */}
      {!isComingSoon && (
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-3 left-[20%] right-[20%] h-8 rounded-[50%] bg-black/0 blur-2xl transition-all duration-500 md:group-hover:bg-black/70"
        />
      )}
      <div
        className={cn(
          "relative h-[340px] w-[272px] xl:h-[335px] xl:w-[360px] rounded-2xl overflow-hidden",
          // Hover lift desktop : la card se soulève + glow doré. Mobile :
          // pas de hover (touch), `md:` gate naturellement les classes.
          // overflow-hidden : indispensable pour clipper le zoom de
          // l'image au hover (sinon scale-110 déborderait du rounded).
          !isComingSoon &&
            // shadow-shine-soft trop intense → version diffuse à
            // opacity 50 % (= ménage doré, le hover lift suffit comme
            // signal principal, le glow reste un appui discret).
            "transition-all duration-500 ease-out md:group-hover:-translate-y-3 md:group-hover:shadow-[0_0_12px_0_rgba(223,185,104,0.4)]",
          // Indication visuelle quand la card est sélectionnée comme
          // filtre actif : ring doré subtle + halo diffus avec offset
          // vertical léger (= "lit from below" plus naturel que le
          // shadow-shine-soft frontal, jugé trop kitsch).
          isSelected &&
            "ring-1 ring-accent/60 shadow-[0_6px_32px_-8px_rgba(223,185,104,0.35)]",
        )}
      >
      {/* Image de fond — couvre toute la card, mais s'estompe en alpha
          sur la moitié basse via mask-image. Pas d'overlay coloré : le
          fond de page (ou ce qu'il y a derrière la card) transparaît
          directement, ce qui donne un fondu nettement plus subtil que
          le gradient peint par-dessus l'image. Au hover desktop : zoom
          subtil (scale-110) pour donner vie à la card. */}
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 1280px) 272px, 360px"
        className={cn(
          "object-cover transition-transform duration-700 ease-out",
          !isComingSoon && "md:group-hover:scale-110",
          isComingSoon && "grayscale brightness-50",
        )}
        style={{
          maskImage: IMAGE_FADE_MASK,
          WebkitMaskImage: IMAGE_FADE_MASK,
        }}
      />

      {/* Titre — mobile : top-[152px] (proportionnel sur card 340px).
          Desktop : top-[155px] (inchangé, calibré sur 335px). */}
      <h3 className="absolute left-[21px] top-[152px] xl:left-[34px] xl:top-[155px] font-body text-[26px] xl:text-h3 uppercase text-foreground">
        {title}
      </h3>

      {/* Sous-titre — mobile : top-[196px]. Desktop : top-[209px]. */}
      <p className="absolute left-[23px] top-[196px] xl:left-[36px] xl:top-[209px] whitespace-pre-line font-body text-body-16 leading-[1.2] text-muted-foreground">
        {displayedSubtitle}
      </p>

      {/* Bouton CTA — mobile : top-[264px] (proportionnel sur 340px).
          Desktop : top-[271px] (inchangé). */}
      {/* Bouton CTA — purement visuel quand la card est wrappée dans un
          interactive container (mode onClick = filtre in-page). Le
          handler de clic est porté par le wrapper, donc on rend l'inner
          Button non-tabbable et non-interactif pour éviter le double
          tab-stop et l'invalidité HTML <button> dans <button>. */}
      <div className="absolute left-[21px] top-[264px] xl:left-[34px] xl:top-[271px]">
        {isComingSoon ? (
          <Button variant="white" disabled tabIndex={-1}>
            Voir les analyses
          </Button>
        ) : (
          <Button
            variant="primary"
            tabIndex={-1}
            className={onClick ? "pointer-events-none" : undefined}
          >
            Voir les analyses
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
      </div>
    </div>
  );

  if (isComingSoon) return card;
  // onClick prioritaire sur href : utilisé par la homepage pour le
  // filtre in-page. Rendu via <div role="button"> (et NON <button>) car
  // la card contient déjà un <Button> "Voir les analyses" — un <button>
  // dans un <button> est invalide HTML et casse l'hydratation Next.js.
  // Le pattern role+tabIndex+onKeyDown est l'équivalent accessible.
  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-pressed={isSelected}
        aria-label={`Filtrer les experts par ${title}`}
        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
      >
        {card}
      </div>
    );
  }
  if (href) return <Link href={href}>{card}</Link>;
  return card;
}
