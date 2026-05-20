import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SportIcon } from "@/lib/sports-icons";

// Token DS accent (#dfb968) appliqué en dur via les props SVG de lucide
// pour garantir le rendu doré indépendamment de la propagation de
// currentColor / des classes Tailwind générées. À factoriser si on en
// ajoute beaucoup d'autres consommateurs.
const ACCENT_GOLD = "#DFB968";

const DIVIDER_GOLD_GRADIENT =
  "linear-gradient(to right, transparent 0%, #DFB968 51%, transparent 100%)";

export interface ExpertCardAnalysis {
  label: string;
  isPickOfTheDay: boolean;
}

export interface ExpertCardProps {
  avatar: string;
  pseudo: string;
  viewsCount: number;
  categories: string[];
  analyses: ExpertCardAnalysis[];
  locked?: boolean;
}

export function ExpertCard({
  avatar,
  pseudo,
  viewsCount,
  categories,
  analyses,
  locked = false,
}: ExpertCardProps) {
  return (
    <div className="w-[322px] rounded-2xl bg-black/40 px-4 py-8">
      {/* Identity row — paddings verticaux par colonne pour positionner
          chaque élément aux coordonnées Figma absolues :
          pseudo @ y=11, EXPERT line @ y=50, cats @ y=12, avatar @ y=0. */}
      <div className="flex items-start gap-4">
        <Image
          src={avatar}
          alt={pseudo}
          width={68}
          height={68}
          className="size-[68px] shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1 pt-[11px]">
          <h3 className="font-body text-h5 text-foreground truncate">
            {pseudo}
          </h3>
          <p className="mt-[19px] font-body text-body-16 whitespace-nowrap">
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
              <SportIcon
                sport={sport}
                className="size-[13px] text-foreground"
              />
            </span>
          ))}
        </div>
      </div>

      {/* Divider doré qui s'estompe — gradient inline pour shunter toute
          dépendance au token Tailwind (rendu garanti). */}
      <div
        aria-hidden
        className="mx-auto mt-[46px] h-px w-[247px] opacity-30"
        style={{ backgroundImage: DIVIDER_GOLD_GRADIENT }}
      />

      {/* Label section : y=162 → 47px après le divider (y=115). mt-12 = 48px, 1px d'écart négligeable. */}
      <p className="mt-12 font-body text-body-16 uppercase text-muted-foreground">
        {analyses.length} analyses du jour
      </p>

      {/* Liste analyses : y=194 → mt-4 (16px) après le label (qui finit à y=178).
          gap-2 entre items = 8px, ce qui donne row-to-row = 16(lh)+8 = 24px (= Figma). */}
      <ul className="mt-4 flex flex-col gap-2">
        {analyses.map((a, i) => (
          <li
            key={i}
            className="flex items-center gap-6 font-body text-body-16"
          >
            <ArrowRight
              color={ACCENT_GOLD}
              strokeWidth={1.5}
              className="size-[14px] shrink-0"
            />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-foreground">{a.label}</span>
              {a.isPickOfTheDay && (
                <Star
                  color={ACCENT_GOLD}
                  fill={ACCENT_GOLD}
                  className="size-[14px] shrink-0"
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Bouton : y=314 → mt-20 (80px) après la fin de la 2e ligne (y=234).
          Pas de flèche sur le bouton "Accéder" : la maquette Figma
          (mobile + desktop) montre un bouton blanc avec texte seul centré.
          Taille `default` (text-body-16, padding 16/32) — version compacte
          demandée pour ne pas dominer la card. */}
      <div className="mt-20 flex justify-center">
        {locked ? (
          <Button variant="white" disabled className="w-[290px]">
            Terminé pour aujourd&apos;hui
          </Button>
        ) : (
          <Button variant="white" className="w-[290px]">
            Accéder (3,50€)
          </Button>
        )}
      </div>
    </div>
  );
}
