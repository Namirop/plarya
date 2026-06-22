"use client";

import { useMemo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEASING_OPTIONS, TEASING_LABELS } from "@/lib/constants";
import { getLeaguesGroupedBySport, getSportLabel, getLeague } from "@/lib/sports";
import type { Bookmaker } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

import { parseTimeInput } from "./parse-time-input";
import {
  EYEBROW_CLASS,
  ERROR_TEXT,
  INPUT_BASE,
  INPUT_INVALID,
  SELECT_CONTENT,
  SELECT_ITEM,
  SELECT_TRIGGER,
} from "./publish-analysis-tokens";
import type { DraftState, Step1Errors } from "./schema";

// ─── Toggle iOS-style ────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]",
        checked ? "bg-accent" : "bg-[#2A2A2A]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow-sm",
          "transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

// ─── Group wrapper — surtitre + contenu ──────────────────────────────

function Group({
  title,
  htmlFor,
  children,
}: {
  title: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={EYEBROW_CLASS}>
        {title}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// ─── Step 1 — "Le pari" ──────────────────────────────────────────────

interface Step1Props {
  values: DraftState;
  errors: Step1Errors;
  bookmakers: Bookmaker[];
  onChange: <K extends keyof DraftState>(field: K, value: DraftState[K]) => void;
  onContinue: () => void;
}

export function Step1BetDetails({ values, errors, bookmakers, onChange, onContinue }: Step1Props) {
  const leaguesGrouped = useMemo(() => getLeaguesGroupedBySport(), []);
  const leagueOptions = useMemo(
    () =>
      Object.entries(leaguesGrouped).flatMap(([sport, leagues]) =>
        leagues.map((l) => ({ sport, league: l })),
      ),
    [leaguesGrouped],
  );

  // Validation continuelle des champs obligatoires : on en a besoin
  // pour activer/désactiver le bouton Continuer.
  const canContinue =
    values.matchName.trim() &&
    values.pick.trim() &&
    parseFloat(values.odds) > 1 &&
    values.teasing &&
    parseTimeInput(values.timeRaw) !== null;

  return (
    <div className="flex flex-col gap-12">
      {/* ─── 1. Ton pick (Pick + Cote) ─── */}
      <Group title="Ton pick" htmlFor="pick">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
          <input
            id="pick"
            type="text"
            placeholder="PSG gagne, +2.5 buts, Mbappé buteur…"
            value={values.pick}
            onChange={(e) => onChange("pick", e.target.value)}
            aria-invalid={!!errors.pick}
            className={cn(INPUT_BASE, errors.pick && INPUT_INVALID)}
          />

          {/* Cote : input avec micro-label intégré "COTE" en haut-gauche.
              Police display Hubot Sans, text-2xl, align right. */}
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1.5 font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70"
            >
              Cote
            </span>
            <input
              id="odds"
              type="text"
              inputMode="decimal"
              placeholder="1.85"
              value={values.odds}
              onChange={(e) =>
                // Accepter virgule ou point — normaliser au point pour
                // parseFloat ultérieur.
                onChange("odds", e.target.value.replace(",", "."))
              }
              aria-invalid={!!errors.odds}
              className={cn(
                "h-[60px] w-full rounded-[3px] border border-[#2A2A2A] bg-transparent",
                "pt-5 pb-2 pl-3.5 pr-3.5",
                "text-right font-display text-[24px] tabular-nums text-foreground placeholder:text-muted-foreground/40",
                "outline-none transition-all duration-150",
                "focus-visible:border-accent/60 focus-visible:text-[28px]",
                errors.odds && "border-destructive/60 focus-visible:border-destructive",
              )}
            />
          </div>
        </div>
        {(errors.pick || errors.odds) && <p className={ERROR_TEXT}>{errors.pick || errors.odds}</p>}
      </Group>

      {/* ─── 2. Le match (Match + Ligue) ─── */}
      <Group title="Le match" htmlFor="matchName">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            id="matchName"
            type="text"
            placeholder="PSG - Marseille"
            value={values.matchName}
            onChange={(e) => onChange("matchName", e.target.value)}
            aria-invalid={!!errors.matchName}
            className={cn(INPUT_BASE, errors.matchName && INPUT_INVALID)}
          />

          <Select
            value={values.league || undefined}
            onValueChange={(v) => onChange("league", v === "__none__" ? "" : (v ?? ""))}
          >
            <SelectTrigger size="default" className={SELECT_TRIGGER} aria-label="Ligue">
              <SelectValue placeholder="Ligue / compétition (optionnel)">
                {values.league ? getLeague(values.league)?.name || values.league : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT}>
              <SelectItem value="__none__" className={SELECT_ITEM}>
                Aucune / Autre
              </SelectItem>
              {leagueOptions.map(({ sport, league: l }) => (
                <SelectItem key={l.id} value={l.id} className={SELECT_ITEM}>
                  <span className="inline-flex items-center gap-2">
                    <span className="flag-emoji text-[15px] leading-none">{l.country}</span>
                    <span>{l.name}</span>
                    <span className="text-muted-foreground/40 text-[12px]">
                      {getSportLabel(sport)}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {errors.matchName && <p className={ERROR_TEXT}>{errors.matchName}</p>}
      </Group>

      {/* ─── 3. Détails (Teasing + Heure) ─── */}
      <Group title="Détails">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
          <Select
            value={values.teasing || undefined}
            onValueChange={(v) => onChange("teasing", v ?? "")}
          >
            <SelectTrigger
              size="default"
              className={cn(SELECT_TRIGGER, errors.teasing && INPUT_INVALID)}
              aria-label="Teasing"
            >
              <SelectValue placeholder="Choisir un teasing">
                {values.teasing ? TEASING_LABELS[values.teasing] : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT}>
              {TEASING_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className={SELECT_ITEM}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="text"
            inputMode="numeric"
            placeholder="18:30"
            value={values.timeRaw}
            onChange={(e) => onChange("timeRaw", e.target.value)}
            aria-invalid={!!errors.timeRaw}
            aria-label="Heure de début"
            className={cn(
              "h-[46px] w-full rounded-[3px] border border-[#2A2A2A] bg-transparent px-3.5",
              "text-right font-display text-[20px] tabular-nums text-foreground placeholder:text-muted-foreground/40",
              "outline-none transition-colors duration-200",
              "focus-visible:border-accent/60",
              errors.timeRaw && "border-destructive/60 focus-visible:border-destructive",
            )}
          />
        </div>
        {(errors.teasing || errors.timeRaw) && (
          <p className={ERROR_TEXT}>{errors.teasing || errors.timeRaw}</p>
        )}
      </Group>

      {/* ─── 4. Bookmakers (collapsible) ─── */}
      {bookmakers.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => onChange("bookmakersOpen", !values.bookmakersOpen)}
            className="inline-flex items-center gap-1.5 font-body text-[14px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <span aria-hidden className="text-[14px] leading-none">
              {values.bookmakersOpen ? "−" : "+"}
            </span>
            <span>
              {values.bookmakersOpen
                ? "Masquer les cotes bookmakers"
                : "Ajouter des cotes bookmakers (optionnel)"}
            </span>
          </button>

          {values.bookmakersOpen && (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {bookmakers.map((bm) => (
                <div key={bm.id}>
                  <label htmlFor={`bm-${bm.id}`} className={EYEBROW_CLASS}>
                    {bm.name}
                  </label>
                  <input
                    id={`bm-${bm.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="1.85"
                    value={values.bookmakerOdds[bm.id] || ""}
                    onChange={(e) =>
                      onChange("bookmakerOdds", {
                        ...values.bookmakerOdds,
                        [bm.id]: e.target.value.replace(",", "."),
                      })
                    }
                    className={cn(INPUT_BASE, "mt-2 text-right font-display tabular-nums")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 5. Toggle "analyse du jour" ─── */}
      <div className="flex items-start gap-4">
        <Toggle
          checked={values.isFeatured}
          onChange={(next) => onChange("isFeatured", next)}
          ariaLabel="Mettre en avant comme analyse du jour"
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-body text-[16px] font-medium text-foreground">
            Mettre en avant comme analyse du jour
          </span>
          <span className="font-body text-[14px] text-muted-foreground">
            1 par jour. Visibilité maximale sur ton profil.
          </span>
        </div>
      </div>

      {/* ─── 6. Continuer → — Button primary rectangulaire (DA gold solide) ─── */}
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="primary" size="md" onClick={onContinue} disabled={!canContinue}>
          Continuer
          <span aria-hidden>→</span>
        </Button>
      </div>
    </div>
  );
}
