"use client";

import { useState } from "react";

import { Check, PencilSimple, Star, X } from "@phosphor-icons/react";

import { TEASING_LABELS } from "@/lib/constants";
import { formatStartTime } from "@/lib/date";
import { getLeague } from "@/lib/sports";
import type { Prono } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

// ───────────────────────────────────────────────────────────────────
// Classes "boutons résultat" — inline plutôt qu'ajoutées au DS Button
// pour ne pas polluer le composant partagé. Vert/rouge tirés des
// tokens CLAUDE.md §3 (#10B981 / #EF4444), gardés en valeurs littérales
// car non encore exposés comme utilities Tailwind dans le @theme.
// ───────────────────────────────────────────────────────────────────

// inline-flex + justify-center : sur desktop les boutons gardent leur
// largeur intrinsèque (justify-center sans effet) ; en mobile on les
// rend full-width via `flex-1 w-full` au niveau du wrapper et le
// justify-center recentre alors le contenu (icône + texte).
const RESULT_BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl border bg-transparent px-4 py-2 " +
  "font-body text-body-16 transition-colors duration-200 cursor-pointer " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const RESULT_BUTTON_WIN = "border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10";

const RESULT_BUTTON_LOSS = "border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10";

const RESULT_BADGE_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body text-body-16";

const RESULT_BADGE_WIN = "bg-[#22c55e]/10 text-[#22c55e]";
const RESULT_BADGE_LOSS = "bg-[#ef4444]/10 text-[#ef4444]";

const EDIT_BUTTON =
  "inline-flex items-center gap-1.5 font-body text-body-16 text-muted-foreground " +
  "transition-colors duration-200 hover:text-foreground cursor-pointer";

// ───────────────────────────────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────────────────────────────

export interface AnalysesListProps {
  /** Liste fetchée par le parent depuis `GET /pronos/mine`. Triée par
   *  createdAt DESC côté backend (cf. routes/pronos.ts:105). */
  pronos: Prono[];
  /** Callback déclenché au clic sur "Gagné" / "Perdu". Le parent appelle
   *  `PATCH /pronos/:id/result` et met à jour son state pronos +
   *  re-fetch profil (cf. handleResult dans dashboard/page.tsx). */
  onResult: (id: string, result: "WON" | "LOST") => Promise<void> | void;
}

export function AnalysesList({ pronos, onResult }: AnalysesListProps) {
  // IDs des pronos en mode "édition" : pour les analyses ayant déjà un
  // résultat (WON/LOST), permet à l'utilisateur de revenir à l'affichage
  // des 2 boutons Gagné/Perdu pour modifier. État purement frontend ;
  // l'appel API n'a lieu qu'au re-clic d'un résultat (Cf. brief §"Logique
  // nouvelle" : pas de bascule PENDING côté DB).
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
    // Sort du mode édition une fois le résultat enregistré.
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
        // "PENDING" ou édition forcée → affiche les 2 boutons.
        const showActionButtons = p.result === "PENDING" || isEditing;
        return (
          <AnalysisCard
            key={p.id}
            prono={p}
            showActionButtons={showActionButtons}
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
  onEdit: () => void;
  onResult: (result: "WON" | "LOST") => Promise<void> | void;
}

function AnalysisCard({ prono, showActionButtons, onEdit, onResult }: AnalysisCardProps) {
  const leagueLabel = prono.league ? getLeague(prono.league)?.name || prono.league : null;
  const publishedAt = new Date(prono.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li
      className={cn(
        // Padding interne : 16px mobile, 24px desktop.
        "flex flex-col gap-6 rounded-2xl border border-[#181818] bg-black/40 p-4 md:p-6",
        // Desktop : layout horizontal contenu/actions. Mobile : stack.
        "md:flex-row md:items-start md:justify-between",
      )}
    >
      {/* Contenu — flex-1 pour absorber la place restante en desktop. */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Header : match + badge "analyse du jour" éventuel */}
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-body text-h5 text-foreground">{prono.matchName}</h3>
          {prono.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 font-body text-[14px] leading-none text-accent">
              <Star className="size-3" fill="currentColor" strokeWidth={0} />
              Analyse du jour
            </span>
          )}
        </div>

        {/* Pick + cote (cote en doré). */}
        <p className="font-body text-body-16 text-foreground">
          {prono.pick} <span className="text-muted-foreground">— </span>
          <span className="text-accent">@{prono.odds}</span>
        </p>

        {/* Ligue + heure de début du match, en muted. */}
        {(leagueLabel || prono.startTime) && (
          <p className="font-body text-body-16 text-muted-foreground">
            {leagueLabel}
            {leagueLabel && prono.startTime && <span className="mx-2 opacity-50">·</span>}
            {prono.startTime && formatStartTime(prono.startTime)}
          </p>
        )}

        {/* Teasing (label humain depuis TEASING_LABELS). */}
        <p className="font-body text-body-16 text-muted-foreground">
          {TEASING_LABELS[prono.teasing] || prono.teasing}
        </p>

        {/* Argumentaire (paragraphe complet). */}
        {prono.argument && (
          <p className="font-body text-body-16 leading-relaxed text-foreground">{prono.argument}</p>
        )}

        {/* Date de publication en bas, plus petit + muted. */}
        <p className="font-body text-[14px] text-muted-foreground/70">Publié le {publishedAt}</p>
      </div>

      {/* Zone actions — alignée en haut sur desktop (top de la card),
          stack en bas du contenu sur mobile.
          Mobile : full-width pour que les boutons Gagné/Perdu prennent
          50/50 (flex-1). Desktop : width naturelle, boutons à droite. */}
      <div className="flex w-full shrink-0 items-center gap-3 md:w-auto md:pt-1">
        {showActionButtons ? (
          <>
            <button
              type="button"
              onClick={() => onResult("WON")}
              className={cn(RESULT_BUTTON_BASE, RESULT_BUTTON_WIN, "flex-1 md:flex-initial")}
            >
              <Check className="size-4" strokeWidth={2.5} />
              Gagné
            </button>
            <button
              type="button"
              onClick={() => onResult("LOST")}
              className={cn(RESULT_BUTTON_BASE, RESULT_BUTTON_LOSS, "flex-1 md:flex-initial")}
            >
              <X className="size-4" strokeWidth={2.5} />
              Perdu
            </button>
          </>
        ) : (
          <>
            {prono.result === "WON" ? (
              <span className={cn(RESULT_BADGE_BASE, RESULT_BADGE_WIN)}>
                <Check className="size-4" strokeWidth={2.5} />
                Gagné
              </span>
            ) : (
              <span className={cn(RESULT_BADGE_BASE, RESULT_BADGE_LOSS)}>
                <X className="size-4" strokeWidth={2.5} />
                Perdu
              </span>
            )}
            <button
              type="button"
              onClick={onEdit}
              className={EDIT_BUTTON}
              aria-label="Modifier le résultat de cette analyse"
            >
              <PencilSimple className="size-3.5" />
              Modifier
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#181818] bg-black/40 px-4 py-10 text-center md:px-6 md:py-12">
      <p className="font-body text-body-16 text-foreground">
        Vous n&apos;avez publié aucune analyse pour l&apos;instant.
      </p>
      <p className="mt-2 font-body text-body-16 text-muted-foreground">
        Utilisez le formulaire ci-dessus pour publier votre première analyse.
      </p>
    </div>
  );
}
