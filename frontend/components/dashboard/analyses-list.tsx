"use client";

import { useState } from "react";

import { Check, PencilSimple, Star, X } from "@phosphor-icons/react";

import { TEASING_LABELS } from "@/lib/constants";
import { formatStartTime } from "@/lib/date";
import { getLeague } from "@/lib/sports";
import type { Prono } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

// Boutons de résultat en relief (dégradé vertical, reflet intérieur en haut,
// enfoncement au clic), bord à bord en pied de carte : la carte en
// overflow-hidden arrondit leurs coins. `leading-none` aligne verticalement
// « Gagné » et « Perdu » malgré des métriques de glyphes différentes.
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

// Résultat déjà saisi : bandeau coloré à la place des boutons.
const RESULT_INDICATOR_BASE = cn(
  "flex w-full items-center justify-center gap-2 px-4 py-3",
  "font-body text-body-16 font-semibold",
);
const RESULT_INDICATOR_WIN = "bg-green-500/15 text-green-400";
const RESULT_INDICATOR_LOSS = "bg-red-500/15 text-red-400";

// « Modifier » en haut à droite : icône seule en mobile, icône et texte en desktop.
const EDIT_BUTTON = cn(
  "absolute right-3 top-3 z-10 inline-flex items-center gap-1.5",
  "rounded-lg border border-white/10 bg-black/40 backdrop-blur",
  "p-2 md:px-3 md:py-2 font-body text-body-16 text-muted-foreground",
  "transition-colors duration-200 hover:border-white/20 hover:text-foreground cursor-pointer",
);

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

  // Modification possible une fois le résultat saisi, hors édition en cours.
  const showEditButton = prono.result !== "PENDING" && !isEditing;

  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-surface-2",
        "bg-[linear-gradient(135deg,rgba(20,18,18,0.55)_0%,rgba(10,9,9,0.65)_100%)]",
        "transition-colors duration-200 hover:border-surface-4",
      )}
    >
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

      <div
        className={cn(
          "flex flex-col gap-3 p-4 md:p-6",
          // Réserve la place du bouton « Modifier » en desktop.
          showEditButton && "md:pr-[140px]",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-body text-h5 text-foreground">{prono.matchName}</h3>
          {prono.isFeatured && (
            <Star className="size-5 text-accent" weight="fill" aria-label="Analyse du jour" />
          )}
        </div>

        <p className="font-body text-body-16 text-foreground">
          {prono.pick} <span className="text-muted-foreground">— </span>
          <span className="text-foreground">@{prono.odds}</span>
        </p>

        {(leagueLabel || prono.startTime) && (
          <p className="font-body text-body-16 text-muted-foreground">
            {leagueLabel}
            {leagueLabel && prono.startTime && <span className="mx-2 opacity-50">·</span>}
            {prono.startTime && formatStartTime(prono.startTime)}
          </p>
        )}

        <p className="font-body text-body-16 text-muted-foreground">
          {TEASING_LABELS[prono.teasing] || prono.teasing}
        </p>

        {prono.argument && (
          <p className="font-body text-body-16 leading-relaxed text-foreground">{prono.argument}</p>
        )}

        <p className="font-body text-[14px] text-muted-foreground/70">Publié le {publishedAt}</p>
      </div>

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
              {/* Décalé d'1 px : le × paraît plus haut que le ✓ à alignement égal. */}
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
