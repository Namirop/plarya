"use client";

import { Button } from "@/components/ui/button";
import { getLeague } from "@/lib/sports";
import { cn } from "@/lib/utils";

import { parseTimeInput } from "./parse-time-input";
import { EYEBROW_CLASS, ERROR_TEXT } from "./publish-analysis-tokens";
import type { DraftState } from "./schema";

function formatTime({ hours, minutes }: { hours: number; minutes: number }): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

interface Step2Props {
  values: DraftState;
  step2Error: string;
  submitError: string;
  submitting: boolean;
  onChange: <K extends keyof DraftState>(field: K, value: DraftState[K]) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function Step2Analysis({
  values,
  step2Error,
  submitError,
  submitting,
  onChange,
  onBack,
  onSubmit,
}: Step2Props) {
  const wordCount = countWords(values.argument);
  const leagueLabel = values.league ? getLeague(values.league)?.name || values.league : null;
  const timeParsed = parseTimeInput(values.timeRaw);
  const timeLabel = timeParsed ? formatTime(timeParsed) : "";

  // Compose la ligne 1 du récap : Match · [Ligue ·] Heure. La ligue
  // est skip si vide ou si l'expert a sélectionné "Aucune / Autre"
  // (auquel cas leagueLabel est null).
  const line1Parts: string[] = [];
  if (values.matchName) line1Parts.push(values.matchName);
  if (leagueLabel) line1Parts.push(leagueLabel);
  if (timeLabel) line1Parts.push(timeLabel);

  return (
    <div className="flex flex-col">
      {/* ── Récap compact (sous le stepper) ──
          Border-left 2px accent : marque le bloc comme "citation
          contextuelle" sans alourdir avec une card. Padding agrandi
          vs v1 pour donner plus de présence (px-5 py-5 + text 15px). */}
      <div className="mb-10 border-l-2 border-accent px-5 py-5">
        <p className="font-body text-[15px] text-foreground">
          {line1Parts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2 text-muted-foreground">·</span>}
              {part}
            </span>
          ))}
        </p>
        <p className="mt-2 font-body text-[15px] text-muted-foreground">
          Pick : <span className="text-foreground">{values.pick || "—"}</span>
          <span className="mx-2">·</span>
          Cote{" "}
          <span className="font-display tabular-nums text-foreground">{values.odds || "—"}</span>
        </p>
      </div>

      {/* ── Ton analyse (textarea pleine largeur) ── */}
      <label htmlFor="argument" className={EYEBROW_CLASS}>
        Ton analyse
      </label>
      <div className="relative mt-2">
        <textarea
          id="argument"
          value={values.argument}
          onChange={(e) => onChange("argument", e.target.value)}
          placeholder="Pourquoi cette analyse ? Explique ton raisonnement, les stats sur lesquelles tu t'appuies, les éléments contextuels que tu as observés…"
          rows={12}
          aria-describedby="word-count"
          className={cn(
            "min-h-[280px] md:min-h-[400px] w-full resize-y rounded-[4px] bg-[#1F1F1F] p-6",
            "font-body text-[18px] leading-[1.7] text-foreground placeholder:text-muted-foreground/60",
            "outline-none transition-shadow duration-200",
            "focus-visible:ring-1 focus-visible:ring-accent",
          )}
        />
        {/* Compteur de mots : absolu bottom-right, 12px depuis le bord.
            Logique pluriel : "0 mots, 1 mot, 2 mots, 3 mots…" — seul le
            singulier 1 mot n'a pas de "s". */}
        <span
          id="word-count"
          aria-live="polite"
          className="pointer-events-none absolute bottom-3 right-3 font-body text-[12px] text-muted-foreground"
        >
          {wordCount} mot{wordCount !== 1 ? "s" : ""}
        </span>
      </div>

      {step2Error && <p className={ERROR_TEXT}>{step2Error}</p>}
      {submitError && <p className={ERROR_TEXT}>{submitError}</p>}

      {/* Barre du bas — Retour à gauche + Publier à droite. Stack
          mobile (bouton Publier en haut via flex-col-reverse). */}
      <div className="mt-12 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "inline-flex items-center gap-1.5 self-start font-body text-[14px] text-muted-foreground",
            "transition-colors duration-200 hover:text-foreground cursor-pointer",
          )}
        >
          <span aria-hidden>←</span>
          Retour
        </button>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onSubmit}
          disabled={submitting || values.argument.trim().length < 20}
          className="w-full sm:w-auto"
        >
          {submitting && (
            <span
              aria-hidden
              className="inline-block size-4 animate-spin rounded-full border-2 border-black/40 border-t-black"
            />
          )}
          {submitting ? "Publication…" : "Publier l'analyse"}
        </Button>
      </div>
    </div>
  );
}
