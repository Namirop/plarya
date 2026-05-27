"use client";

import Image from "next/image";
import Link from "next/link";

import { Star } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { CardTilt } from "@/components/ui/card-tilt";
import { SportIcon } from "@/lib/sports-icons";

// Token DS accent (#dfb968) appliqué en dur via les props SVG de lucide
// pour garantir le rendu doré indépendamment de la propagation de
// currentColor / des classes Tailwind générées. À factoriser si on en
// ajoute beaucoup d'autres consommateurs.
// Couleur doré conservée pour l'ÉTOILE pick-of-the-day uniquement
// (signal sémantique). La flèche puce de liste est passée en blanc.
const ACCENT_GOLD = "#DFB968";

// Divider neutre — anciennement gradient doré, neutralisé en 3B
// (multiplié par N cards dans le carrousel = saturation).
const DIVIDER_NEUTRAL_GRADIENT =
  "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.15) 51%, transparent 100%)";

export interface ExpertCardAnalysis {
  label: string;
  isPickOfTheDay: boolean;
}

export interface ExpertCardProps {
  /** ID du expert pour construire le href `/experts/[id]`. Si omis,
   *  la card est rendue sans wrapper Link (utile pour les pages de
   *  test interne `/test-expert-card`, qui montrent la card en mode
   *  vitrine sans navigation). */
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

      {/* Divider doré qui s'estompe — gradient inline pour shunter toute
          dépendance au token Tailwind (rendu garanti). */}
      <div
        aria-hidden
        className="mx-auto mt-[46px] h-px w-[247px] opacity-30"
        style={{ backgroundImage: DIVIDER_NEUTRAL_GRADIENT }}
      />

      {/* Label section : y=162 → 47px après le divider (y=115). mt-12 = 48px, 1px d'écart négligeable. */}
      <p className="mt-12 font-body text-body-16 uppercase text-muted-foreground">
        {analyses.length} analyses du jour
      </p>

      {/* Liste analyses : y=194 → mt-4 (16px) après le label (qui finit à y=178).
          gap-2 entre items = 8px, ce qui donne row-to-row = 16(lh)+8 = 24px (= Figma).
          `min-h-[40px]` réserve la hauteur de 2 lignes (16+8+16) même
          quand il n'y a qu'une seule analyse → toutes les cards du
          carrousel ont une hauteur identique. `slice(0, 2)` au cas où
          un expert pousserait 3+ analyses (on en affiche max 2 dans
          la vitrine homepage). */}
      <ul className="mt-4 flex min-h-[40px] flex-col gap-2">
        {analyses.slice(0, 2).map((a, i) => (
          <li key={i} className="flex items-center gap-4 font-body text-body-16">
            {/* Flèche longue dorée (custom SVG) — Phosphor ArrowRight
                est trop carré (ratio 1:1). Ici 28×8 → arrow allongée
                + tête fine, pattern visuel proche de la maquette. */}
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

      {/* Bouton : y=314 → mt-20 (80px) après la fin de la 2e ligne (y=234).
          Pas de flèche sur le bouton "Accéder" : la maquette Figma
          (mobile + desktop) montre un bouton blanc avec texte seul centré.
          Taille `default` (text-body-16, padding 16/32) — version compacte
          demandée pour ne pas dominer la card. */}
      {/* Boutons rendus en non-interactifs (tabIndex/pointer-events) :
          la navigation est portée par le Link wrapper, le bouton est
          purement visuel pour signaler l'état. Sur l'état `locked`,
          `disabled` ajoute `pointer-events-none` (via le variant
          button), donc les clics traversent vers le Link wrapper → la
          card reste cliquable même en "terminé". */}
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

  // Si pas d'id (vitrine / tests), on rend la card "nue", sans navigation.
  if (!id) return <CardTilt>{inner}</CardTilt>;

  // Wrapper Link sur toute la card — UX décidée brief Bloc 1 §2 : la
  // card entière mène au profil expert, y compris en état `locked`
  // (l'utilisateur peut vouloir voir les analyses futures de l'expert).
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
