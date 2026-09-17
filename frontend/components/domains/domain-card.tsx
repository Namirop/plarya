import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Masque alpha sur l'image : sa moitié basse devient transparente et laisse
// voir le fond de page sous le texte, sans overlay coloré.
const IMAGE_FADE_MASK = "linear-gradient(to bottom, black 0%, black 40%, transparent 75%)";

export interface DomainCardProps {
  image: string;
  title: string;
  /** `\n` force un saut de ligne. */
  subtitle: string;
  state?: "active" | "coming-soon";
  /** Ignoré si `onClick` est fourni ou si la carte est « coming-soon ». */
  href?: string;
  /** Prioritaire sur `href` (filtre de la section experts sur l'accueil). */
  onClick?: () => void;
  /** Domaine actuellement utilisé comme filtre. */
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
    // `group` porte le hover ; l'ombre portée est hors de l'élément en
    // overflow-hidden pour ne pas être rognée.
    <div className={cn("group relative", !isComingSoon && "transition-all duration-500 ease-out")}>
      {!isComingSoon && (
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-3 left-[20%] right-[20%] h-8 rounded-[50%] bg-black/0 blur-2xl transition-all duration-500 md:group-hover:bg-black/70"
        />
      )}
      <div
        className={cn(
          "relative h-[340px] w-[272px] xl:h-[335px] xl:w-[360px] rounded-2xl overflow-hidden",
          // overflow-hidden rogne le zoom de l'image au survol.
          !isComingSoon &&
            "transition-all duration-500 ease-out md:group-hover:-translate-y-3 md:group-hover:shadow-[0_0_12px_0_rgba(223,185,104,0.4)]",
          isSelected &&
            "ring-1 ring-accent/60 shadow-[0_6px_32px_-8px_rgba(223,185,104,0.35)]",
        )}
      >
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

      <h3 className="absolute left-[21px] top-[152px] xl:left-[34px] xl:top-[155px] font-body text-[26px] xl:text-h3 uppercase text-foreground">
        {title}
      </h3>

      <p className="absolute left-[23px] top-[196px] xl:left-[36px] xl:top-[209px] whitespace-pre-line font-body text-body-16 leading-[1.2] text-muted-foreground">
        {displayedSubtitle}
      </p>

      {/* Bouton décoratif hors tabulation : le clic est porté par le
          conteneur (évite un double arrêt de tabulation). */}
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
  // <div role="button"> et non <button> : la carte contient déjà un bouton,
  // et un <button> imbriqué est invalide (erreur d'hydratation).
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
