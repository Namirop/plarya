import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mask appliqué sur l'image elle-même (mode alpha, comme dans la spec
// Figma `mask-alpha`). L'image devient transparente sur sa moitié basse,
// donc le fond de page apparaît directement à travers — fade plus subtil
// qu'un overlay coloré (qui peignait par-dessus avec une couleur plate).
// Stops calibrés sur Figma : image opaque jusqu'à ~40 %, fade jusqu'à
// ~75 %, totalement transparent en bas (= zone titre/sous-titre/bouton).
const IMAGE_FADE_MASK =
  "linear-gradient(to bottom, black 0%, black 40%, transparent 75%)";

export interface DomainCardProps {
  image: string;
  title: string;
  /** Peut contenir un `\n` pour forcer un saut de ligne (cf. Sport / Esport en 2 lignes). */
  subtitle: string;
  state?: "active" | "coming-soon";
  /** Lien de destination — ignoré si state="coming-soon". */
  href?: string;
}

export function DomainCard({
  image,
  title,
  subtitle,
  state = "active",
  href,
}: DomainCardProps) {
  const isComingSoon = state === "coming-soon";
  const displayedSubtitle = isComingSoon ? "Arrive bientôt" : subtitle;

  const card = (
    // Mobile : 256 × 319 (= taille focus de la spec mobile, permet de
    // laisser apparaître les voisines partielles dans le carrousel).
    // Desktop : 381 × 335 (inchangé). Tous les éléments enfants
    // (positions absolute du titre/sous-titre/bouton) sont calibrés sur
    // la version desktop ; en mobile on les repositionne proportionnellement.
    <div className="relative h-[319px] w-[256px] md:h-[335px] md:w-[381px] rounded-2xl">
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
        className={cn(
          "object-cover rounded-2xl",
          isComingSoon && "grayscale brightness-50",
        )}
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
      <div className="absolute left-[19px] top-[247px] md:left-[34px] md:top-[271px]">
        {isComingSoon ? (
          <Button variant="white" disabled>
            Voir les analyses
          </Button>
        ) : (
          <Button variant="primary">
            Voir les analyses
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (isComingSoon || !href) return card;
  return <Link href={href}>{card}</Link>;
}
