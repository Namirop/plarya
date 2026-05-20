"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Check } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type {
  Bookmaker,
  Prono,
  PublishFormFieldErrors,
  TipsterProfile,
} from "@/lib/types/dashboard";

// ───────────────────────────────────────────────────────────────────
// Tokens visuels — appliqués partout dans le form pour homogénéité.
// On ne touche pas aux composants Input/Textarea/Select du DS global :
// l'override se fait localement via className pour garder ces composants
// utilisables ailleurs avec leur style shadcn par défaut.
// ───────────────────────────────────────────────────────────────────

const FIELD_BASE =
  "h-12 w-full rounded-xl border border-[#181818] bg-black/40 px-4 py-3 " +
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground " +
  "outline-none transition-colors duration-200 " +
  "focus-visible:border-accent focus-visible:ring-0";

const FIELD_INVALID = "border-destructive aria-invalid:ring-0";

const TEXTAREA_BASE =
  "min-h-[120px] w-full resize-y rounded-xl border border-[#181818] bg-black/40 px-4 py-3 " +
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground " +
  "outline-none transition-colors duration-200 " +
  "focus-visible:border-accent focus-visible:ring-0";

const SELECT_TRIGGER_BASE =
  "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#181818] bg-black/40 px-4 py-3 " +
  "font-body text-body-16 text-foreground data-placeholder:text-muted-foreground " +
  "outline-none transition-colors duration-200 " +
  "focus-visible:border-accent focus-visible:ring-0 " +
  "data-[size=default]:h-12";

const SELECT_CONTENT_CLASS =
  "rounded-xl border border-[#181818] bg-surface text-foreground shadow-xl";

const SELECT_ITEM_CLASS =
  "cursor-pointer rounded-lg px-3 py-2 font-body text-body-16 text-foreground " +
  "data-highlighted:bg-accent/15 data-highlighted:text-accent";

const LABEL_CLASS = "block font-body text-body-16 text-foreground";

const ERROR_TEXT_CLASS = "mt-1 font-body text-[14px] leading-[1.3] text-destructive";

// ───────────────────────────────────────────────────────────────────
// Sous-composants internes pour réduire la verbosité du JSX principal.
// ───────────────────────────────────────────────────────────────────

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

function Field({ label, htmlFor, required, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
      {error && <p className={ERROR_TEXT_CLASS}>{error}</p>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Composant principal
// ───────────────────────────────────────────────────────────────────

export interface PublishAnalysisFormProps {
  /** Bookmakers fetchés par le parent (déjà chargés par la page
   *  dashboard via `GET /bookmakers`). Optionnel : si vide, la section
   *  cotes bookmakers n'est pas rendue. */
  bookmakers: Bookmaker[];
  /** Callback de succès — reçu par le parent pour mettre à jour ses
   *  states `pronos` et `profile`. Le composant gère l'appel API
   *  `POST /pronos` puis le re-fetch `/tipsters/me` (logique V1
   *  conservée à l'identique), et passe les deux résultats au parent. */
  onPublished: (newProno: Prono, updatedProfile: TipsterProfile) => void;
}

export function PublishAnalysisForm({
  bookmakers,
  onPublished,
}: PublishAnalysisFormProps) {
  // ── State : reproduction exacte du V1 (cf. app/dashboard/page.tsx
  //    lignes 73-87 avant Bloc 2). 12 useState pour rester fidèle.
  const [matchName, setMatchName] = useState("");
  const [league, setLeague] = useState("");
  const [pick, setPick] = useState("");
  const [odds, setOdds] = useState("");
  const [teasing, setTeasing] = useState("");
  const [argument, setArgument] = useState("");
  const [startTime, setStartTime] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [bookmakerOdds, setBookmakerOdds] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PublishFormFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Helpers — identiques au V1, juste déplacés.
  function buildStartDate(time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  function validateForm(): boolean {
    const errors: PublishFormFieldErrors = {};
    if (!matchName.trim()) errors.matchName = "Le match est requis";
    if (!pick.trim()) errors.pick = "Le pick est requis";
    if (!odds || parseFloat(odds) <= 0)
      errors.odds = "La cote doit être positive";
    if (!teasing) errors.teasing = "Le teasing est requis";
    if (!startTime) {
      errors.startTime = "L'heure de début est requise";
    } else if (buildStartDate(startTime) <= new Date()) {
      errors.startTime = "L'heure de début doit être dans le futur";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const bmOddsPayload = Object.entries(bookmakerOdds)
        .filter(([, val]) => val && parseFloat(val) > 0)
        .map(([bookmakerId, val]) => ({
          bookmakerId,
          odds: parseFloat(val),
        }));
      const newProno = await apiPost<Prono>("/pronos", {
        matchName,
        league: league || undefined,
        pick,
        odds: parseFloat(odds),
        teasing,
        argument: argument || undefined,
        startTime: buildStartDate(startTime).toISOString(),
        isFeatured,
        ...(bmOddsPayload.length > 0 ? { bookmakerOdds: bmOddsPayload } : {}),
      });
      // Reset form (V1 fidèle)
      setMatchName("");
      setLeague("");
      setPick("");
      setOdds("");
      setTeasing("");
      setArgument("");
      setStartTime("");
      setIsFeatured(false);
      setBookmakerOdds({});
      setFieldErrors({});
      // Re-fetch profil puis émission vers le parent — V1 faisait les 2
      // séparément (`setPronos` + `setProfile`), ici on bundle dans le
      // callback unique pour garder l'API du composant simple.
      const updatedProfile = await apiGet<TipsterProfile>("/tipsters/me");
      onPublished(newProno, updatedProfile);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erreur lors de la publication",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Helpers de mise à jour state — clearent l'erreur correspondante
  //    dès que l'utilisateur tape (cf. V1 line 287-294 etc.).
  function clearFieldError(name: keyof PublishFormFieldErrors) {
    if (fieldErrors[name]) {
      setFieldErrors((p) => ({ ...p, [name]: undefined }));
    }
  }

  // Liste des ligues regroupées par sport, pour le Select Ligue (V1).
  const leaguesGrouped = getLeaguesGroupedBySport();
  const leagueOptions = Object.entries(leaguesGrouped).flatMap(
    ([sport, leagues]) => leagues.map((l) => ({ sport, league: l })),
  );

  // Format des selects HH/MM séparés (V1 stockait startTime en "HH:MM").
  const hourValue = startTime ? startTime.split(":")[0] : "";
  const minuteValue = startTime ? startTime.split(":")[1] || "" : "";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      // Padding interne : 16px mobile, 32px desktop (cf. brief — la
      // surface card est plus étroite en mobile, on resserre).
      className="rounded-2xl border border-[#181818] bg-black/40 p-4 md:p-8"
    >
      {formError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-body-16 text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* ─── Ligne 1 : Match + Ligue ─── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label="Match"
            htmlFor="matchName"
            required
            error={fieldErrors.matchName}
          >
            <input
              id="matchName"
              type="text"
              placeholder="PSG - Marseille"
              value={matchName}
              onChange={(e) => {
                setMatchName(e.target.value);
                clearFieldError("matchName");
              }}
              aria-invalid={!!fieldErrors.matchName}
              className={cn(FIELD_BASE, fieldErrors.matchName && FIELD_INVALID)}
            />
          </Field>

          <Field label="Ligue / Compétition">
            <Select
              value={league || undefined}
              onValueChange={(v) => setLeague(v === "__none__" ? "" : (v ?? ""))}
            >
              <SelectTrigger
                size="default"
                className={SELECT_TRIGGER_BASE}
              >
                <SelectValue placeholder="Aucune / Autre">
                  {league ? getLeague(league)?.name || league : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT_CLASS}>
                <SelectItem value="__none__" className={SELECT_ITEM_CLASS}>
                  Aucune / Autre
                </SelectItem>
                {leagueOptions.map(({ sport, league: l }) => (
                  <SelectItem
                    key={l.id}
                    value={l.id}
                    className={SELECT_ITEM_CLASS}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="text-muted-foreground/60 text-[14px]">
                        {l.country}
                      </span>
                      <span>{l.name}</span>
                      <span className="text-muted-foreground/40 text-[12px]">
                        {getSportLabel(sport)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* ─── Ligne 2 : Pick + Cote ─── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label="Pick"
            htmlFor="pick"
            required
            error={fieldErrors.pick}
          >
            <input
              id="pick"
              type="text"
              placeholder="PSG gagne"
              value={pick}
              onChange={(e) => {
                setPick(e.target.value);
                clearFieldError("pick");
              }}
              aria-invalid={!!fieldErrors.pick}
              className={cn(FIELD_BASE, fieldErrors.pick && FIELD_INVALID)}
            />
          </Field>

          <Field
            label="Cote"
            htmlFor="odds"
            required
            error={fieldErrors.odds}
          >
            <input
              id="odds"
              type="number"
              step="0.01"
              min="1"
              placeholder="1.85"
              value={odds}
              onChange={(e) => {
                setOdds(e.target.value);
                clearFieldError("odds");
              }}
              aria-invalid={!!fieldErrors.odds}
              className={cn(FIELD_BASE, fieldErrors.odds && FIELD_INVALID)}
            />
          </Field>
        </div>

        {/* ─── Ligne 3 : Teasing (pleine largeur) ─── */}
        <Field label="Teasing" required error={fieldErrors.teasing}>
          <Select
            value={teasing || undefined}
            onValueChange={(v) => {
              setTeasing(v ?? "");
              clearFieldError("teasing");
            }}
          >
            <SelectTrigger
              size="default"
              className={cn(SELECT_TRIGGER_BASE, fieldErrors.teasing && FIELD_INVALID)}
              aria-invalid={!!fieldErrors.teasing}
            >
              <SelectValue placeholder="Choisir un teasing">
                {teasing ? TEASING_LABELS[teasing] : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              {TEASING_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className={SELECT_ITEM_CLASS}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* ─── Ligne 4 : Heure de début (HH : MM côte à côte) ─── */}
        <Field
          label="Heure de début du match"
          required
          error={fieldErrors.startTime}
        >
          <div className="flex items-center gap-3">
            <Select
              value={hourValue || undefined}
              onValueChange={(h) => {
                const m = minuteValue || "00";
                setStartTime(`${h}:${m}`);
                clearFieldError("startTime");
              }}
            >
              <SelectTrigger
                size="default"
                className={cn(
                  SELECT_TRIGGER_BASE,
                  "w-32",
                  fieldErrors.startTime && FIELD_INVALID,
                )}
              >
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className={cn(SELECT_CONTENT_CLASS, "max-h-52")}>
                {Array.from({ length: 24 }, (_, i) =>
                  String(i).padStart(2, "0"),
                ).map((h) => (
                  <SelectItem key={h} value={h} className={SELECT_ITEM_CLASS}>
                    {h}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="font-display text-h4 text-muted-foreground">:</span>

            <Select
              value={minuteValue || undefined}
              onValueChange={(m) => {
                const h = hourValue || "12";
                setStartTime(`${h}:${m}`);
                clearFieldError("startTime");
              }}
            >
              <SelectTrigger
                size="default"
                className={cn(
                  SELECT_TRIGGER_BASE,
                  "w-32",
                  fieldErrors.startTime && FIELD_INVALID,
                )}
              >
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className={cn(SELECT_CONTENT_CLASS, "max-h-52")}>
                {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                  (m) => (
                    <SelectItem key={m} value={m} className={SELECT_ITEM_CLASS}>
                      {m}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </Field>

        {/* ─── Ligne 5 : Cotes bookmakers (optionnel) ─── */}
        {bookmakers.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className={LABEL_CLASS}>Cotes bookmakers (optionnel)</span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {bookmakers.map((bm) => (
                <div key={bm.id} className="flex flex-col gap-1.5">
                  <span className="font-body text-[14px] text-muted-foreground">
                    {bm.name}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="ex: 1.85"
                    value={bookmakerOdds[bm.id] || ""}
                    onChange={(e) =>
                      setBookmakerOdds((prev) => ({
                        ...prev,
                        [bm.id]: e.target.value,
                      }))
                    }
                    className={FIELD_BASE}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Ligne 6 : Argumentaire ─── */}
        <Field label="Argumentaire" htmlFor="argument">
          <textarea
            id="argument"
            placeholder="Pourquoi ce pick ? (visible après achat)"
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            rows={5}
            className={TEXTAREA_BASE}
          />
        </Field>

        {/* ─── Ligne 7 : Checkbox "analyse du jour" ─── */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={isFeatured}
            onClick={() => setIsFeatured((v) => !v)}
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
              isFeatured
                ? "border-accent bg-accent"
                : "border-[#181818] bg-black/40",
            )}
          >
            {isFeatured && (
              <Check className="size-3.5 text-black" strokeWidth={3} />
            )}
          </button>
          <div className="flex flex-col gap-1">
            <span className="font-body text-body-16 text-foreground">
              Marquer comme analyse du jour
            </span>
            <span className="font-body text-[14px] leading-[1.3] text-muted-foreground">
              Une seule analyse peut être mise en avant par jour
            </span>
          </div>
        </div>

        {/* ─── Bouton submit pleine largeur ─── */}
        <Button
          type="submit"
          variant="white"
          disabled={submitting}
          className="mt-2 w-full"
        >
          {submitting ? "Publication..." : "Publier l'analyse"}
        </Button>
      </div>
    </form>
  );
}
