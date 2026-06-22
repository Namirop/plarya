"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api";
import { TEASING_OPTIONS, TEASING_LABELS } from "@/lib/constants";
import { getLeaguesGroupedBySport, getSportLabel, getLeague } from "@/lib/sports";
import type { Bookmaker, Prono, ExpertProfile } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

// ════════════════════════════════════════════════════════════════════
// Publish Analysis Form — wizard 2 étapes
//
// Étape 1 "Le pari" : data structurée (match, ligue, pick, cote,
//   teasing, heure, bookmakers, toggle "analyse du jour")
// Étape 2 "L'analyse" : rédaction argumentaire + preview live browser
//
// Pas de card-container — surface-warm-1 sur toute la zone du form,
// padding 64/32, max-width 1000. Borders 3px radius, accent doré rare
// (≤ 2 occurrences par étape : toggle + Continuer en step1, focus
// ring + Publier en step2).
//
// State managé via useState (12 champs) + sessionStorage pour
// préserver le draft entre reloads. Submit final via POST /pronos en
// fin d'étape 2 — endpoint backend inchangé.
// ════════════════════════════════════════════════════════════════════

// ─── Tokens visuels (cohérents toutes étapes) ────────────────────────

const INPUT_BASE = cn(
  "w-full rounded-[3px] border border-[#2A2A2A] bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

const INPUT_INVALID = "border-destructive/60 focus-visible:border-destructive";

const SELECT_TRIGGER = cn(
  "flex w-full items-center justify-between gap-2 rounded-[3px] border border-[#2A2A2A] bg-transparent px-3.5 py-3",
  "font-body text-[16px] text-foreground data-placeholder:text-muted-foreground/60",
  "outline-none transition-colors duration-200",
  "focus-visible:border-accent/60",
  "h-[46px] data-[size=default]:h-[46px]",
);

// Popup déroulant : bg légèrement au-dessus du form (#181818) pour
// que le menu flotte sans paraître écrasé. Border et radius matchent
// les inputs (3px, #2A2A2A) → cohérence visuelle avec le form.
const SELECT_CONTENT = cn(
  "rounded-[3px] border border-[#2A2A2A] bg-[#1F1F1F] text-foreground shadow-xl",
);

const SELECT_ITEM = cn(
  "cursor-pointer rounded-sm px-3 py-2 font-body text-[15px] text-foreground",
  "data-highlighted:bg-white/[0.06] data-highlighted:text-foreground",
);

// Sur-titre (label de groupe ou de champ) — 11px uppercase tracking
// 0.15em muted. JAMAIS d'accent doré dessus.
const EYEBROW_CLASS = cn(
  "block font-body text-[11px] uppercase tracking-[0.15em] text-muted-foreground",
);

const ERROR_TEXT = "mt-2 font-body text-[13px] leading-[1.3] text-destructive/90";

// ─── Helpers ─────────────────────────────────────────────────────────

// Parse une heure tapée librement : "18h30", "18:30", "1830", "18 30",
// "18h". Retourne { hours, minutes } ou null si invalide.
function parseTimeInput(raw: string): { hours: number; minutes: number } | null {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned) return null;

  let h: number | undefined;
  let min: number | undefined;

  // Format 4 chiffres collés "1830"
  if (/^\d{4}$/.test(cleaned)) {
    h = parseInt(cleaned.slice(0, 2), 10);
    min = parseInt(cleaned.slice(2), 10);
  }
  // Formats avec séparateur "18h30" / "18:30" / éventuellement "18h"
  else {
    const m = cleaned.match(/^(\d{1,2})[h:](\d{0,2})$/) || cleaned.match(/^(\d{1,2})(h)?$/);
    if (!m) return null;
    h = parseInt(m[1], 10);
    min = m[2] && /^\d+$/.test(m[2]) ? parseInt(m[2], 10) : 0;
  }

  if (h === undefined || min === undefined) return null;
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { hours: h, minutes: min };
}

function formatTime({ hours, minutes }: { hours: number; minutes: number }): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

// ─── Types ───────────────────────────────────────────────────────────

interface DraftState {
  matchName: string;
  league: string;
  pick: string;
  odds: string;
  teasing: string;
  argument: string;
  timeRaw: string;
  isFeatured: boolean;
  bookmakerOdds: Record<string, string>;
  bookmakersOpen: boolean;
}

const STORAGE_KEY = "plarya-analysis-draft";

// ─── Composant principal ─────────────────────────────────────────────

export interface PublishAnalysisFormProps {
  bookmakers: Bookmaker[];
  onPublished: (newProno: Prono, updatedProfile: ExpertProfile) => void;
}

export function PublishAnalysisForm({ bookmakers, onPublished }: PublishAnalysisFormProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [matchName, setMatchName] = useState("");
  const [league, setLeague] = useState("");
  const [pick, setPick] = useState("");
  const [odds, setOdds] = useState("");
  const [teasing, setTeasing] = useState("");
  const [argument, setArgument] = useState("");
  const [timeRaw, setTimeRaw] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [bookmakerOdds, setBookmakerOdds] = useState<Record<string, string>>({});
  const [bookmakersOpen, setBookmakersOpen] = useState(false);

  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Error, setStep2Error] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── SessionStorage : draft persistence ──────────────────────────
  // Restaure le draft au mount. Une fois restauré, l'effet de
  // persistance ci-dessous re-écrit (idempotent).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<DraftState>;
      if (draft.matchName) setMatchName(draft.matchName);
      if (draft.league) setLeague(draft.league);
      if (draft.pick) setPick(draft.pick);
      if (draft.odds) setOdds(draft.odds);
      if (draft.teasing) setTeasing(draft.teasing);
      if (draft.argument) setArgument(draft.argument);
      if (draft.timeRaw) setTimeRaw(draft.timeRaw);
      if (typeof draft.isFeatured === "boolean") setIsFeatured(draft.isFeatured);
      if (draft.bookmakerOdds) setBookmakerOdds(draft.bookmakerOdds);
      if (typeof draft.bookmakersOpen === "boolean") setBookmakersOpen(draft.bookmakersOpen);
    } catch {
      /* corrupted draft → ignore */
    }
  }, []);

  // Persiste à chaque changement (effet "save on type"). Si l'user
  // recharge en pleine rédaction, son draft est intact.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const draft: DraftState = {
      matchName,
      league,
      pick,
      odds,
      teasing,
      argument,
      timeRaw,
      isFeatured,
      bookmakerOdds,
      bookmakersOpen,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* quota plein ou storage indispo → silencieux */
    }
  }, [
    matchName,
    league,
    pick,
    odds,
    teasing,
    argument,
    timeRaw,
    isFeatured,
    bookmakerOdds,
    bookmakersOpen,
  ]);

  function resetForm() {
    setMatchName("");
    setLeague("");
    setPick("");
    setOdds("");
    setTeasing("");
    setArgument("");
    setTimeRaw("");
    setIsFeatured(false);
    setBookmakerOdds({});
    setBookmakersOpen(false);
    setStep(1);
    setStep1Errors({});
    setStep2Error("");
    setSubmitError("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  // ── Validation étape 1 ──────────────────────────────────────────
  function validateStep1(): boolean {
    const errors: Record<string, string> = {};
    if (!matchName.trim()) errors.matchName = "Le match est requis";
    if (!pick.trim()) errors.pick = "Le pick est requis";
    const parsedOdds = parseFloat(odds);
    if (!odds || Number.isNaN(parsedOdds) || parsedOdds <= 1) {
      errors.odds = "Cote invalide";
    }
    if (!teasing) errors.teasing = "Teasing requis";
    const t = parseTimeInput(timeRaw);
    if (!t) {
      errors.time = "Format invalide";
    } else {
      const d = new Date();
      d.setHours(t.hours, t.minutes, 0, 0);
      if (d <= new Date()) errors.time = "L'heure doit être dans le futur";
    }
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinue() {
    setSubmitError("");
    if (!validateStep1()) return;
    setStep(2);
    // Scroll top pour révéler la zone rédaction.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    setStep2Error("");
    setStep(1);
  }

  // ── Submit final (étape 2) ──────────────────────────────────────
  async function handleSubmit() {
    setStep2Error("");
    setSubmitError("");
    if (argument.trim().length < 20) {
      setStep2Error("L'analyse doit contenir au moins 20 caractères");
      return;
    }
    const t = parseTimeInput(timeRaw);
    if (!t) {
      // Cas tordu : l'user a re-modifié l'heure depuis l'étape 1 (n'arrive
      // pas via l'UI, mais sécurité). Ramène-le à l'étape 1.
      setStep(1);
      setStep1Errors({ time: "Format invalide" });
      return;
    }
    const startDate = new Date();
    startDate.setHours(t.hours, t.minutes, 0, 0);

    setSubmitting(true);
    try {
      const bmOddsPayload = Object.entries(bookmakerOdds)
        .filter(([, val]) => val && parseFloat(val) > 1)
        .map(([bookmakerId, val]) => ({ bookmakerId, odds: parseFloat(val) }));

      const newProno = await apiPost<Prono>("/pronos", {
        matchName,
        league: league || undefined,
        pick,
        odds: parseFloat(odds),
        teasing,
        argument,
        startTime: startDate.toISOString(),
        isFeatured,
        ...(bmOddsPayload.length > 0 ? { bookmakerOdds: bmOddsPayload } : {}),
      });

      const updatedProfile = await apiGet<ExpertProfile>("/experts/me");
      resetForm();
      onPublished(newProno, updatedProfile);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Conteneur : fond noir neutre 2-3 points au-dessus du body bg
    // (body = #131212, form = #181818). Pas de border, pas de shadow,
    // pas de gradient — le contraste vient uniquement de la nuance
    // d'élévation. Radius 8px (lg). Padding resserré vs v1 (était
    // py-16 → trop aéré) : py-10 desktop / py-7 mobile.
    <div className="mx-auto w-full max-w-[1000px] rounded-lg bg-[#181818] px-5 py-7 md:px-12 md:py-10">
      <Stepper step={step} />

      {step === 1 ? (
        <Step1View
          matchName={matchName}
          league={league}
          pick={pick}
          odds={odds}
          teasing={teasing}
          timeRaw={timeRaw}
          isFeatured={isFeatured}
          bookmakers={bookmakers}
          bookmakerOdds={bookmakerOdds}
          bookmakersOpen={bookmakersOpen}
          errors={step1Errors}
          onMatchName={setMatchName}
          onLeague={setLeague}
          onPick={setPick}
          onOdds={setOdds}
          onTeasing={setTeasing}
          onTimeRaw={setTimeRaw}
          onIsFeatured={setIsFeatured}
          onBookmakerOdds={setBookmakerOdds}
          onBookmakersOpen={setBookmakersOpen}
          onClearError={(name) => setStep1Errors((p) => ({ ...p, [name]: "" }))}
          onContinue={handleContinue}
        />
      ) : (
        <Step2View
          argument={argument}
          matchName={matchName}
          league={league}
          pick={pick}
          odds={odds}
          timeRaw={timeRaw}
          step2Error={step2Error}
          submitError={submitError}
          submitting={submitting}
          onArgument={setArgument}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Stepper (1 ─── 2) — éditorial minimaliste
// ────────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-12 flex items-center justify-center gap-4">
      <span
        aria-current={step === 1 ? "step" : undefined}
        className={cn(
          "font-display text-[18px] tabular-nums transition-colors",
          step === 1 ? "text-accent" : "text-muted-foreground",
        )}
      >
        1
      </span>
      <span
        aria-hidden
        className={cn(
          "block h-px w-10 transition-colors",
          step === 2 ? "bg-accent" : "bg-[#2A2A2A]",
        )}
      />
      <span
        aria-current={step === 2 ? "step" : undefined}
        className={cn(
          "font-display text-[18px] tabular-nums transition-colors",
          step === 2 ? "text-accent" : "text-muted-foreground",
        )}
      >
        2
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Toggle iOS-style
// ────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────
// Group wrapper — surtitre + contenu
// ────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────
// Step 1 — "Le pari"
// ────────────────────────────────────────────────────────────────────

interface Step1Props {
  matchName: string;
  league: string;
  pick: string;
  odds: string;
  teasing: string;
  timeRaw: string;
  isFeatured: boolean;
  bookmakers: Bookmaker[];
  bookmakerOdds: Record<string, string>;
  bookmakersOpen: boolean;
  errors: Record<string, string>;
  onMatchName: (v: string) => void;
  onLeague: (v: string) => void;
  onPick: (v: string) => void;
  onOdds: (v: string) => void;
  onTeasing: (v: string) => void;
  onTimeRaw: (v: string) => void;
  onIsFeatured: (v: boolean) => void;
  onBookmakerOdds: (v: Record<string, string>) => void;
  onBookmakersOpen: (v: boolean) => void;
  onClearError: (name: string) => void;
  onContinue: () => void;
}

function Step1View({
  matchName,
  league,
  pick,
  odds,
  teasing,
  timeRaw,
  isFeatured,
  bookmakers,
  bookmakerOdds,
  bookmakersOpen,
  errors,
  onMatchName,
  onLeague,
  onPick,
  onOdds,
  onTeasing,
  onTimeRaw,
  onIsFeatured,
  onBookmakerOdds,
  onBookmakersOpen,
  onClearError,
  onContinue,
}: Step1Props) {
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
    matchName.trim() &&
    pick.trim() &&
    parseFloat(odds) > 1 &&
    teasing &&
    parseTimeInput(timeRaw) !== null;

  return (
    <div className="flex flex-col gap-12">
      {/* ─── 1. Ton pick (Pick + Cote) ─── */}
      <Group title="Ton pick" htmlFor="pick">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
          <input
            id="pick"
            type="text"
            placeholder="PSG gagne, +2.5 buts, Mbappé buteur…"
            value={pick}
            onChange={(e) => {
              onPick(e.target.value);
              onClearError("pick");
            }}
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
              value={odds}
              onChange={(e) => {
                // Accepter virgule ou point — normaliser au point pour
                // parseFloat ultérieur.
                onOdds(e.target.value.replace(",", "."));
                onClearError("odds");
              }}
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
        {(errors.pick || errors.odds) && (
          <p className={ERROR_TEXT}>{errors.pick || errors.odds}</p>
        )}
      </Group>

      {/* ─── 2. Le match (Match + Ligue) ─── */}
      <Group title="Le match" htmlFor="matchName">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            id="matchName"
            type="text"
            placeholder="PSG - Marseille"
            value={matchName}
            onChange={(e) => {
              onMatchName(e.target.value);
              onClearError("matchName");
            }}
            aria-invalid={!!errors.matchName}
            className={cn(INPUT_BASE, errors.matchName && INPUT_INVALID)}
          />

          <Select
            value={league || undefined}
            onValueChange={(v) => onLeague(v === "__none__" ? "" : (v ?? ""))}
          >
            <SelectTrigger size="default" className={SELECT_TRIGGER} aria-label="Ligue">
              <SelectValue placeholder="Ligue / compétition (optionnel)">
                {league ? getLeague(league)?.name || league : undefined}
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
            value={teasing || undefined}
            onValueChange={(v) => {
              onTeasing(v ?? "");
              onClearError("teasing");
            }}
          >
            <SelectTrigger
              size="default"
              className={cn(SELECT_TRIGGER, errors.teasing && INPUT_INVALID)}
              aria-label="Teasing"
            >
              <SelectValue placeholder="Choisir un teasing">
                {teasing ? TEASING_LABELS[teasing] : undefined}
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
            value={timeRaw}
            onChange={(e) => {
              onTimeRaw(e.target.value);
              onClearError("time");
            }}
            aria-invalid={!!errors.time}
            aria-label="Heure de début"
            className={cn(
              "h-[46px] w-full rounded-[3px] border border-[#2A2A2A] bg-transparent px-3.5",
              "text-right font-display text-[20px] tabular-nums text-foreground placeholder:text-muted-foreground/40",
              "outline-none transition-colors duration-200",
              "focus-visible:border-accent/60",
              errors.time && "border-destructive/60 focus-visible:border-destructive",
            )}
          />
        </div>
        {(errors.teasing || errors.time) && (
          <p className={ERROR_TEXT}>{errors.teasing || errors.time}</p>
        )}
      </Group>

      {/* ─── 4. Bookmakers (collapsible) ─── */}
      {bookmakers.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => onBookmakersOpen(!bookmakersOpen)}
            className="inline-flex items-center gap-1.5 font-body text-[14px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <span aria-hidden className="text-[14px] leading-none">
              {bookmakersOpen ? "−" : "+"}
            </span>
            <span>
              {bookmakersOpen
                ? "Masquer les cotes bookmakers"
                : "Ajouter des cotes bookmakers (optionnel)"}
            </span>
          </button>

          {bookmakersOpen && (
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
                    value={bookmakerOdds[bm.id] || ""}
                    onChange={(e) =>
                      onBookmakerOdds({
                        ...bookmakerOdds,
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
          checked={isFeatured}
          onChange={onIsFeatured}
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
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continuer
          <span aria-hidden>→</span>
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 2 — "L'analyse"
// ────────────────────────────────────────────────────────────────────

interface Step2Props {
  argument: string;
  matchName: string;
  league: string;
  pick: string;
  odds: string;
  timeRaw: string;
  step2Error: string;
  submitError: string;
  submitting: boolean;
  onArgument: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function Step2View({
  argument,
  matchName,
  league,
  odds,
  pick,
  timeRaw,
  step2Error,
  submitError,
  submitting,
  onArgument,
  onBack,
  onSubmit,
}: Step2Props) {
  const wordCount = countWords(argument);
  const leagueLabel = league ? getLeague(league)?.name || league : null;
  const timeParsed = parseTimeInput(timeRaw);
  const timeLabel = timeParsed ? formatTime(timeParsed) : "";

  // Compose la ligne 1 du récap : Match · [Ligue ·] Heure. La ligue
  // est skip si vide ou si l'expert a sélectionné "Aucune / Autre"
  // (auquel cas leagueLabel est null).
  const line1Parts: string[] = [];
  if (matchName) line1Parts.push(matchName);
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
          Pick : <span className="text-foreground">{pick || "—"}</span>
          <span className="mx-2">·</span>
          Cote{" "}
          <span className="font-display tabular-nums text-foreground">{odds || "—"}</span>
        </p>
      </div>

      {/* ── Ton analyse (textarea pleine largeur) ── */}
      <label htmlFor="argument" className={EYEBROW_CLASS}>
        Ton analyse
      </label>
      <div className="relative mt-2">
        <textarea
          id="argument"
          value={argument}
          onChange={(e) => onArgument(e.target.value)}
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
          disabled={submitting || argument.trim().length < 20}
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
