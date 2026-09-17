"use client";

import Image from "next/image";
import Link from "next/link";

import { Star } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { CardTilt } from "@/components/ui/card-tilt";
import { SportIcon } from "@/lib/sports-icons";

// Doré (--color-accent) passé en props SVG à l'étoile « pick du jour » :
// rendu indépendant de currentColor.
const ACCENT_GOLD = "#DFB968";

const DIVIDER_NEUTRAL_GRADIENT =
  "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.15) 51%, transparent 100%)";

export interface ExpertCardAnalysis {
  label: string;
  isPickOfTheDay: boolean;
}

export interface ExpertCardProps {
  /** Sans id, la carte est rendue sans lien vers `/experts/[id]`. */
  id?: string;
  avatar: string;
  pseudo: string;
  viewsCount: number;
  categories: string[];
  analyses: ExpertCardAnalysis[];
  locked?: boolean;
}

export function ExpertCard({
  id,
  avatar,
  pseudo,
  viewsCount,
  categories,
  analyses,
  locked = false,
}: ExpertCardProps) {
  const inner = (
    <div className="w-[322px] rounded-2xl bg-black/40 px-6 py-6">
      <div className="flex items-start gap-4">
        <Image
          src={avatar}
          alt={pseudo}
          width={68}
          height={68}
          className="size-[68px] shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1 pt-[11px]">
          <h3 className="font-body text-h5 text-foreground truncate">{pseudo}</h3>
          <p className="mt-[15px] font-body text-body-16 whitespace-nowrap">
            <span className="text-accent">EXPERT</span>{" "}
            <span className="text-muted-foreground">{viewsCount} vues</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2 pt-[12px]">
          {categories.map((sport) => (
            <span
              key={sport}
              className="flex size-[21px] items-center justify-center rounded-lg bg-surface-elevated"
            >
              <SportIcon sport={sport} className="size-[13px] text-foreground" />
            </span>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="mx-auto mt-[46px] h-px w-[247px] opacity-30"
        style={{ backgroundImage: DIVIDER_NEUTRAL_GRADIENT }}
      />

      <p className="mt-12 font-body text-body-16 uppercase text-muted-foreground">
        {analyses.length} {analyses.length === 1 ? "analyse" : "analyses"} du jour
      </p>

      {/* Deux analyses au plus ; min-h réserve deux lignes pour que toutes
          les cartes du carrousel aient la même hauteur. */}
      <ul className="mt-4 flex min-h-[40px] flex-col gap-2">
        {analyses.slice(0, 2).map((a, i) => (
          <li key={i} className="flex items-center gap-4 font-body text-body-16">
            {/* Flèche allongée en SVG (ArrowRight de Phosphor est carrée). */}
            <svg
              aria-hidden
              width="28"
              height="8"
              viewBox="0 0 28 8"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M0 4 H26 M22 1 L26 4 L22 7"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-foreground">{a.label}</span>
              {a.isPickOfTheDay && (
                <Star
                  color={ACCENT_GOLD}
                  fill={ACCENT_GOLD}
                  weight="fill"
                  className="size-[14px] shrink-0"
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Bouton décoratif, hors tabulation et sans pointer-events : le clic
          atteint le Link parent, y compris à l'état « Terminé ». */}
      <div className="mt-20 flex justify-center">
        {locked ? (
          <Button variant="white" disabled className="w-[290px]" tabIndex={-1}>
            Terminé pour aujourd&apos;hui
          </Button>
        ) : (
          <Button variant="white" className="w-[290px] pointer-events-none" tabIndex={-1}>
            Accéder (3,50€)
          </Button>
        )}
      </div>
    </div>
  );

  if (!id) return <CardTilt>{inner}</CardTilt>;

  // Toute la carte mène au profil, y compris à l'état « Terminé ».
  return (
    <Link
      href={`/experts/${id}`}
      aria-label={`Voir le profil de ${pseudo}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
    >
      <CardTilt>{inner}</CardTilt>
    </Link>
  );
}
