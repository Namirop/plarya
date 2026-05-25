"use client";

import { User } from "@phosphor-icons/react";

import { SPORT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Preview LIVE du profil expert tel qu'il apparaîtra une fois créé.
// Reçoit le state du formulaire en props et se re-render à chaque
// modification : la card se "remplit" en temps réel quand l'user tape
// son pseudo, sélectionne ses sports, écrit sa bio.
//
// Pas d'animation typewriter / pas d'appel API — purement visuel.
// Sticky desktop (top-24) pour rester visible pendant que l'user
// scroll dans le formulaire.

export interface ExpertProfilePreviewProps {
  pseudo: string;
  bio: string;
  sports: string[];
  email?: string | null;
}

export function ExpertProfilePreview({ pseudo, bio, sports, email }: ExpertProfilePreviewProps) {
  // Placeholders affichés quand le champ est vide. Le style change
  // (italique + opacity réduite) pour signaler "valeur de démo" vs
  // "valeur réelle saisie par l'user".
  const trimmedPseudo = pseudo.trim();
  const trimmedBio = bio.trim();
  const displayPseudo = trimmedPseudo || "TonPseudo";
  const displayBio = trimmedBio || "Ta bio apparaîtra ici";

  return (
    <div className="lg:sticky lg:top-24">
      {/* Pré-titre + hint */}
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Ton futur profil
      </p>
      <p className="mt-1 font-body text-body-14 text-muted-foreground/70">
        Ton profil se construit en temps réel
      </p>

      {/* Card preview — reprend la composition de l'ExpertProfileMockup
          du Hero mais avec props dynamiques + état "placeholder" pour
          les champs vides. */}
      <div className="mt-5 rounded-2xl border border-surface-3 bg-gradient-to-br from-surface-2 to-surface-3 p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] md:p-6">
        {/* Header : avatar gris + pseudo + email + badge EXPERT */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-elevated">
            <User size={22} weight="regular" className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-body text-body-18 font-bold transition-opacity duration-200",
                trimmedPseudo ? "text-foreground" : "text-muted-foreground/40 italic",
              )}
            >
              {displayPseudo}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider text-accent">
                Expert
              </span>
              {email && (
                <span className="truncate font-body text-body-14 text-muted-foreground">
                  {email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sports chips ou placeholder italique */}
        <div className="mt-5">
          {sports.length === 0 ? (
            <p className="font-body text-body-14 italic text-muted-foreground/40">
              Sélectionne tes sports
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 transition-opacity duration-200">
              {sports.map((key) => {
                const label = SPORT_LABELS[key] ?? key;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated/60 px-3 py-1 font-body text-[13px] text-foreground"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Bio ou placeholder italique. Divider doré-neutre au-dessus
            (border-t surface-3) pour structurer comme dans le mockup. */}
        <div className="mt-5 border-t border-surface-3 pt-4">
          <p
            className={cn(
              "font-body text-body-14 leading-[1.5] transition-opacity duration-200",
              trimmedBio ? "text-foreground" : "text-muted-foreground/40 italic",
            )}
          >
            {displayBio}
          </p>
        </div>

        {/* Stats fictives en disabled — l'user voit ce qu'il aura
            (compteurs à 0, Win Rate vide). Pas modifiables, juste
            indicatives ; opacity-50 pour le signal "à construire". */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-surface-3 pt-4 opacity-50">
          <div className="flex flex-col items-center text-center">
            <p className="font-body text-[20px] font-bold leading-none tabular-nums text-foreground">
              0
            </p>
            <p className="mt-1.5 font-body text-[11px] uppercase tracking-wider text-muted-foreground">
              Abonnés
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="font-body text-[20px] font-bold leading-none tabular-nums text-foreground">
              0
            </p>
            <p className="mt-1.5 font-body text-[11px] uppercase tracking-wider text-muted-foreground">
              Analyses
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <p className="font-body text-[20px] font-bold leading-none tabular-nums text-foreground">
              —
            </p>
            <p className="mt-1.5 font-body text-[11px] uppercase tracking-wider text-muted-foreground">
              Win Rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
