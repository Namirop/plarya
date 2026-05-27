"use client";

import { SPORT_LABELS, stripSportEmoji } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Preview LIVE du futur profil expert. Affichée dans le panneau droit
// de la section §3 du formulaire /devenir-expert.
//
// Format "fenêtre navigateur" (vs ancienne card de profil) :
//  - Barre chrome browser (3 cercles macOS + URL bar dynamique
//    plarya.com/experts/{pseudo})
//  - Contenu : reproduit la structure d'un vrai profil expert
//    Plarya (avatar, pseudo, badge EXPERT, sports en tags inline,
//    bio, stats placeholder)
//
// Effet recherché : l'user voit son profil se construire dans une
// "vraie" page du site, pas dans une card abstraite. Pivot
// psychologique → projection concrète.
//
// Reçoit le state du form en props, re-render à chaque keystroke.
// Pas d'animation typewriter — fluide via re-render React standard.
// Sticky desktop (top-24) pour rester visible pendant le scroll.

export interface ExpertProfilePreviewProps {
  pseudo: string;
  bio: string;
  sports: string[];
}

// Slug pseudo pour l'URL : lowercase + supprime caractères non
// alphanum. Côté visuel uniquement (pas envoyé au backend) — n'a
// pas besoin de matcher exactement la règle de slug serveur.
function slugifyForUrl(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function ExpertProfilePreview({ pseudo, bio, sports }: ExpertProfilePreviewProps) {
  const trimmedPseudo = pseudo.trim();
  const trimmedBio = bio.trim();
  const displayPseudo = trimmedPseudo || "TonPseudo";
  const displayBio = trimmedBio || "Ta bio apparaîtra ici";
  const urlSlug = slugifyForUrl(trimmedPseudo) || "tonpseudo";
  const hasPseudo = trimmedPseudo.length > 0;
  const hasBio = trimmedBio.length > 0;

  return (
    <div className="lg:sticky lg:top-24">
      {/* Pré-titre + hint */}
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Ton futur profil
      </p>
      <p className="mt-1 font-body text-body-14 italic text-muted-foreground">
        Aperçu en temps réel sur plarya.com
      </p>

      {/* ──── Fenêtre navigateur ────
          Wrapper externe : surface-2 (NEUTRE — la preview représente
          une vraie page du site, pas une zone de conversion, donc
          pas de teinte warm ici). Border surface-3 + shadow-2xl
          pour donner du poids. Coins droits (rectangle) — Romain
          préfère cette finition vs l'arrondi browser macOS. */}
      <div className="mt-5 overflow-hidden border border-surface-3 bg-surface-2 shadow-2xl">
        {/* Chrome browser : 3 cercles macOS + URL bar centrée */}
        <div className="flex items-center gap-3 border-b border-surface-3 bg-surface-1 px-3 py-2.5">
          {/* 3 cercles macOS — couleurs réelles (red/yellow/green). */}
          <div className="flex shrink-0 items-center gap-[6px]" aria-hidden>
            <span className="block size-[11px] rounded-full bg-[#FF5F57]" />
            <span className="block size-[11px] rounded-full bg-[#FEBC2E]" />
            <span className="block size-[11px] rounded-full bg-[#28C840]" />
          </div>

          {/* URL bar — centrée via flex-1, max-width contenue.
              Le pseudo dans l'URL est dynamique (slug lowercase). */}
          <div className="mx-auto flex w-[68%] items-center justify-center rounded-md bg-background px-3 py-1">
            <p className="truncate font-mono text-[12px] text-muted-foreground">
              plarya.com/experts/
              <span
                className={cn(
                  "transition-colors duration-150",
                  hasPseudo ? "text-foreground/80" : "text-muted-foreground/50",
                )}
              >
                {urlSlug}
              </span>
            </p>
          </div>
        </div>

        {/* Contenu de la "page" — reproduit la structure d'un vrai
            profil expert Plarya. Padding plus large que le chrome
            browser, comme une page réelle. */}
        <div className="p-6 md:p-7">
          {/* Header expert : photo + pseudo + badge EXPERT.
              Photo pravatar (img plain) — décoratif, aria-hidden,
              cohérent avec le mockup Hero. */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.pravatar.cc/120?img=12"
              alt=""
              width={48}
              height={48}
              aria-hidden
              className="size-12 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate font-body text-body-18 font-bold transition-opacity duration-150",
                  hasPseudo ? "text-foreground" : "italic text-muted-foreground/50",
                )}
              >
                {displayPseudo}
              </p>
              <span className="mt-2 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-accent">
                Expert
              </span>
            </div>
          </div>

          {/* Sports — tags inline éditoriaux (cohérence avec le
              formulaire). Pas de pill, pas de border, juste le nom. */}
          <div className="mt-5">
            {sports.length === 0 ? (
              <p className="font-body text-body-14 italic text-muted-foreground/50">
                Sélectionne tes sports
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1 transition-opacity duration-150">
                {sports.map((key) => {
                  const label = SPORT_LABELS[key] ?? key;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-baseline gap-1.5 font-body text-[14px] text-foreground"
                    >
                      <span aria-hidden className="text-[12px] leading-none text-accent">
                        ✓
                      </span>
                      <span className="underline decoration-accent/40 decoration-1 underline-offset-4">
                        {stripSportEmoji(label)}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bio — texte courant, italique si placeholder. Divider
              au-dessus pour structurer comme un vrai profil. */}
          <div className="mt-5 border-t border-surface-3 pt-4">
            <p
              className={cn(
                "font-body text-body-14 leading-[1.55] transition-opacity duration-150",
                hasBio ? "text-foreground" : "italic text-muted-foreground/50",
              )}
            >
              {displayBio}
            </p>
          </div>

          {/* Stats placeholder — grisées (opacity 50%) pour signaler
              "à construire". Trois colonnes : Abonnés / Analyses /
              Win Rate. Mention "disponibles dès ta première analyse"
              en dessous, italique muted. */}
          <div className="mt-5 border-t border-surface-3 pt-4">
            <div className="grid grid-cols-3 gap-2 opacity-50">
              {[
                { value: "—", label: "Abonnés" },
                { value: "—", label: "Analyses" },
                { value: "—", label: "Win Rate" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <p className="font-body text-[20px] font-bold leading-none tabular-nums text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 font-body text-[11px] uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center font-body text-[12px] italic text-muted-foreground/60">
              Statistiques disponibles dès ta première analyse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
