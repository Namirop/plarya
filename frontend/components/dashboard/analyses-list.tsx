"use client";

import { useState } from "react";

import { Check, PencilSimple, Star, X } from "@phosphor-icons/react";

import { TEASING_LABELS } from "@/lib/constants";
import { formatStartTime } from "@/lib/date";
import { getLeague } from "@/lib/sports";
import type { Prono } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

// ───────────────────────────────────────────────────────────────────
// Boutons résultat — pattern "appuyé" (raised button) cohérent avec
// le screenshot de référence (All Envs / 14D). Recette :
//  - Background gradient subtle (lighter top → darker bottom)
//  - Inset highlight 1px en haut (effet "lumière du dessus")
//  - Outer shadow 1px en bas (effet "épaisseur physique")
//  - À l'active : inversion des shadows + translate-y 1px (effet press)
// Boutons rendus FULL-BLEED dans la card : rounded-none, touchent les
// bords du bas et des côtés (la card a overflow-hidden + rounded-2xl,
// donc les coins inférieurs sont clippés au rayon de la card).
// ───────────────────────────────────────────────────────────────────

// h-12 + leading-none : taille explicite + ligne de texte serrée
// pour neutraliser les différences de métriques entre "Gagné" (qui
// a deux descendeurs "g" + accent "é") et "Perdu" (capitale P + x-height
// uniquement) — sans leading-none, le centrage vertical des deux
// boutons était optiquement décalé d'un pixel.
const RESULT_BUTTON_BASE = cn(
  "relative inline-flex h-12 w-full items-center justify-center gap-2",
  "px-4 font-body text-body-16 font-semibold leading-none cursor-pointer",
  "transition-all duration-150 ease-out",
  "active:translate-y-[1px]",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
);

const RESULT_BUTTON_WIN = cn(
  "bg-[linear-gradient(180deg,#1f7a3c_0%,#155f2d_100%)]",
  "text-white",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
  "hover:brightness-110",
  "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
);

const RESULT_BUTTON_LOSS = cn(
  "bg-[linear-gradient(180deg,#9a2828_0%,#7a1d1d_100%)]",
  "text-white",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
  "hover:brightness-110",
  "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]",
);

// Indicateur full-bleed quand l'analyse est validée (WON/LOST) — barre
// horizontale colorée pleine largeur posée au pied de la card, même
// gabarit que les boutons d'action (cohérence visuelle).
const RESULT_INDICATOR_BASE = cn(
  "flex w-full items-center justify-center gap-2 px-4 py-3",
  "font-body text-body-16 font-semibold",
);
const RESULT_INDICATOR_WIN = "bg-green-500/15 text-green-400";
const RESULT_INDICATOR_LOSS = "bg-red-500/15 text-red-400";

// Bouton modifier — icône seule sur mobile en top-right corner, icône
// + texte sur desktop (responsive). Posé en absolute pour ne pas
// occuper de place dans le flow du contenu.
const EDIT_BUTTON = cn(
  "absolute right-3 top-3 z-10 inline-flex items-center gap-1.5",
  "rounded-lg border border-white/10 bg-black/40 backdrop-blur",
  "p-2 md:px-3 md:py-2 font-body text-body-16 text-muted-foreground",
  "transition-colors duration-200 hover:border-white/20 hover:text-foreground cursor-pointer",
);

// ───────────────────────────────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────────────────────────────

export interface AnalysesListProps {
  pronos: Prono[];
  onResult: (id: string, result: "WON" | "LOST") => Promise<void> | void;
}

export function AnalysesList({ pronos, onResult }: AnalysesListProps) {
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());

  function enterEditMode(id: string) {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function handleResultClick(id: string, result: "WON" | "LOST") {
    await onResult(id, result);
    setEditingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  if (pronos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {pronos.map((p) => {
        const isEditing = editingIds.has(p.id);
        const showActionButtons = p.result === "PENDING" || isEditing;
        return (
          <AnalysisCard
            key={p.id}
            prono={p}
            showActionButtons={showActionButtons}
            isEditing={isEditing}
            onEdit={() => enterEditMode(p.id)}
            onResult={(r) => handleResultClick(p.id, r)}
          />
        );
      })}
    </ul>
  );
}

// ───────────────────────────────────────────────────────────────────
// Sous-composants
// ───────────────────────────────────────────────────────────────────

interface AnalysisCardProps {
  prono: Prono;
  showActionButtons: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onResult: (result: "WON" | "LOST") => Promise<void> | void;
}

function AnalysisCard({
  prono,
  showActionButtons,
  isEditing,
  onEdit,
  onResult,
}: AnalysisCardProps) {
  const leagueLabel = prono.league ? getLeague(prono.league)?.name || prono.league : null;
  const publishedAt = new Date(prono.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Le bouton modifier s'affiche uniquement quand l'analyse est validée
  // (WON ou LOST) ET qu'on n'est pas en train d'éditer. Sur mobile :
  // icône seule (top-right). Sur desktop : icône + texte.
  const showEditButton = prono.result !== "PENDING" && !isEditing;

  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-surface-2",
        // Gradient diagonal subtle (cohérence mockup Hero Devenir Expert).
        "bg-[linear-gradient(135deg,rgba(20,18,18,0.55)_0%,rgba(10,9,9,0.65)_100%)]",
        "transition-colors duration-200 hover:border-surface-4",
      )}
    >
      {/* Bouton modifier — absolute top-right, icône seule en mobile,
          icône + texte en desktop. z-10 pour passer au-dessus du
          contenu (rare cas où le titre wrap proche du corner). */}
      {showEditButton && (
        <button
          type="button"
          onClick={onEdit}
          className={EDIT_BUTTON}
          aria-label="Modifier le résultat de cette analyse"
        >
          <PencilSimple className="size-4" />
          <span className="hidden md:inline">Modifier</span>
        </button>
      )}

      {/* Contenu padded. pr en desktop pour éviter le chevauchement
          avec le bouton modifier qui est en top-right. */}
      <div
        className={cn(
          "flex flex-col gap-3 p-4 md:p-6",
          // pr supplémentaire quand le bouton modifier desktop est
          // affiché (icone + texte = ~110px de large).
          showEditButton && "md:pr-[140px]",
        )}
      >
        {/* Header : match + étoile dorée si "analyse du jour" */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-body text-h5 text-foreground">{prono.matchName}</h3>
          {prono.isFeatured && (
            <Star className="size-5 text-accent" weight="fill" aria-label="Analyse du jour" />
          )}
        </div>

        {/* Pick + cote. */}
        <p className="font-body text-body-16 text-foreground">
          {prono.pick} <span className="text-muted-foreground">— </span>
          <span className="text-foreground">@{prono.odds}</span>
        </p>

        {/* Ligue + heure de début du match. */}
        {(leagueLabel || prono.startTime) && (
          <p className="font-body text-body-16 text-muted-foreground">
            {leagueLabel}
            {leagueLabel && prono.startTime && <span className="mx-2 opacity-50">·</span>}
            {prono.startTime && formatStartTime(prono.startTime)}
          </p>
        )}

        {/* Teasing. */}
        <p className="font-body text-body-16 text-muted-foreground">
          {TEASING_LABELS[prono.teasing] || prono.teasing}
        </p>

        {/* Argumentaire. */}
        {prono.argument && (
          <p className="font-body text-body-16 leading-relaxed text-foreground">{prono.argument}</p>
        )}

        {/* Date de publication. */}
        <p className="font-body text-[14px] text-muted-foreground/70">Publié le {publishedAt}</p>
      </div>

      {/* ─── Zone actions FULL-BLEED ───
          Les boutons/indicateurs touchent les bords gauche, droit et
          bas de la card. Pas de padding wrapper, pas de divider — les
          gradients colorés des boutons sont assez forts pour faire
          séparation visuelle avec le contenu. */}
      {showActionButtons ? (
        <div className="grid grid-cols-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => onResult("WON")}
            className={cn(RESULT_BUTTON_BASE, RESULT_BUTTON_WIN, "border-r border-black/30")}
          >
            <span className="inline-flex items-center gap-2 leading-none">
              <Check className="size-4 shrink-0" weight="bold" />
              <span>Gagné</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onResult("LOST")}
            className={cn(RESULT_BUTTON_BASE, RESULT_BUTTON_LOSS)}
          >
            <span className="inline-flex items-center gap-2 leading-none">
              {/* X nudgé de +1px : son optical center = geometric center
                  (icône parfaitement symétrique), contrairement au
                  Check dont la masse visuelle est dans le bas (la
                  pointe du V). Sans ce nudge, × paraissait optiquement
                  plus haut que ✓ malgré un alignement CSS identique. */}
              <X className="size-4 shrink-0 translate-y-[1px]" weight="bold" />
              <span>Perdu</span>
            </span>
          </button>
        </div>
      ) : (
        <div
          className={cn(
            RESULT_INDICATOR_BASE,
            prono.result === "WON" ? RESULT_INDICATOR_WIN : RESULT_INDICATOR_LOSS,
            "border-t",
            prono.result === "WON" ? "border-green-500/20" : "border-red-500/20",
          )}
        >
          <span className="inline-flex items-center gap-2 leading-none">
            {prono.result === "WON" ? (
              <>
                <Check className="size-4 shrink-0" weight="bold" />
                <span>Gagné</span>
              </>
            ) : (
              <>
                {/* X nudgé de +1px : son optical center = geometric center
                  (icône parfaitement symétrique), contrairement au
                  Check dont la masse visuelle est dans le bas (la
                  pointe du V). Sans ce nudge, × paraissait optiquement
                  plus haut que ✓ malgré un alignement CSS identique. */}
                <X className="size-4 shrink-0 translate-y-[1px]" weight="bold" />
                <span>Perdu</span>
              </>
            )}
          </span>
        </div>
      )}
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-surface-elevated bg-black/40 px-4 py-10 text-center md:px-6 md:py-12">
      <p className="font-body text-body-16 text-foreground">
        Tu n&apos;as publié aucune analyse pour l&apos;instant.
      </p>
      <p className="mt-2 font-body text-body-16 text-muted-foreground">
        Utilise le formulaire ci-dessus pour publier ta première analyse.
      </p>
    </div>
  );
}
