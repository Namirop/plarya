import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Overlay gradient appliqué sur l'image pour faire fondre son bas dans le
// fond de la card (= fond de page). Évite la dépendance au mask-image PNG
// du Figma — voir domain-card-spec.md §2.
const IMAGE_FADE_GRADIENT =
  "linear-gradient(to bottom, transparent 50%, var(--color-background) 100%)";

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
    <div className="relative h-[335px] w-[381px] overflow-hidden rounded-2xl">
      {/* Image de fond — couvre toute la card. Désaturée + assombrie en
          coming-soon pour signaler l'inactivité. */}
      <Image
        src={image}
        alt={title}
        fill
        sizes="381px"
        className={cn(
          "object-cover",
          isComingSoon && "grayscale brightness-50",
        )}
      />

      {/* Overlay gradient — fait fondre le bas de l'image dans le fond de
          la card, permet au titre de se poser sur la zone fondue. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: IMAGE_FADE_GRADIENT }}
      />

      {/* Titre — positionné aux coordonnées Figma exactes (top-155, left-34). */}
      <h3 className="absolute left-[34px] top-[155px] font-body text-h3 uppercase text-foreground">
        {title}
      </h3>

      {/* Sous-titre — 22px sous le titre, support du \n pour les 2 lignes. */}
      <p className="absolute left-[36px] top-[209px] whitespace-pre-line font-body text-body-16 text-muted-foreground">
        {displayedSubtitle}
      </p>

      {/* Bouton CTA — 30px sous le sous-titre (top-271 absolu).
          Active : variant primary (gradient or, glow, flèche).
          Coming-soon : variant white disabled (bg #181818, texte #898181) —
          cohérent avec le pattern "Terminé pour aujourd'hui" de l'ExpertCard.
          Le `disabled` du variant primary ne donnerait qu'un gradient
          à 50% d'opacité, ce qui ne matche pas le rendu attendu. */}
      <div className="absolute left-[34px] top-[271px]">
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
