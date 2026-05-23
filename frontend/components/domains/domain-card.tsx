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
   *  pour piloter le filtre in-page de la section experts (cf. V1
   *  retrouvée : page.tsx state `activeDomain`, scroll vers `#experts`). */
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
    // Mobile : 256 × 319 (= taille focus de la spec mobile, permet de
    // laisser apparaître les voisines partielles dans le carrousel).
    // Desktop : 381 × 335 (inchangé). Tous les éléments enfants
    // (positions absolute du titre/sous-titre/bouton) sont calibrés sur
    // la version desktop ; en mobile on les repositionne proportionnellement.
    <div
      className={cn(
        "relative h-[319px] w-[256px] md:h-[335px] md:w-[381px] rounded-2xl",
        // Indication visuelle quand la card est sélectionnée comme
        // filtre actif : léger glow doré (matche le shadow-shine-soft
        // du DS, utilisé sur d'autres CTA dorés).
        isSelected && "shadow-shine-soft",
      )}
    >
      {/* Image de fond — couvre toute la card, mais s'estompe en alpha
          sur la moitié basse via mask-image. Pas d'overlay coloré : le
          fond de page (ou ce qu'il y a derrière la card) transparaît
          directement, ce qui donne un fondu nettement plus subtil que
          le gradient peint par-dessus l'image. */}
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 768px) 256px, 381px"
        className={cn("object-cover rounded-2xl", isComingSoon && "grayscale brightness-50")}
        style={{
          maskImage: IMAGE_FADE_MASK,
          WebkitMaskImage: IMAGE_FADE_MASK,
        }}
      />

      {/* Titre — mobile : top-[140px] (proportionnel sur card 319px).
          Desktop : top-[155px] (inchangé, calibré sur 335px). */}
      <h3 className="absolute left-[19px] top-[140px] md:left-[34px] md:top-[155px] font-body text-[24px] md:text-h3 uppercase text-foreground">
        {title}
      </h3>

      {/* Sous-titre — mobile : top-[184px]. Desktop : top-[209px]. */}
      <p className="absolute left-[21px] top-[184px] md:left-[36px] md:top-[209px] whitespace-pre-line font-body text-body-16 leading-[1.2] text-muted-foreground">
        {displayedSubtitle}
      </p>

      {/* Bouton CTA — mobile : top-[247px] (= valeur Figma spec mobile).
          Desktop : top-[271px] (inchangé). */}
      {/* Bouton CTA — purement visuel quand la card est wrappée dans un
          interactive container (mode onClick = filtre in-page). Le
          handler de clic est porté par le wrapper, donc on rend l'inner
          Button non-tabbable et non-interactif pour éviter le double
          tab-stop et l'invalidité HTML <button> dans <button>. */}
      <div className="absolute left-[19px] top-[247px] md:left-[34px] md:top-[271px]">
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
