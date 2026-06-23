"use client";

import { useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { Bookmaker, Prono, DashboardExpertStats } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

import { parseTimeInput } from "./parse-time-input";
import { step1Schema, step2Schema, type DraftState, type Step1Errors } from "./schema";
import { Step1BetDetails } from "./step-1-bet-details";
import { Step2Analysis } from "./step-2-analysis";
import { useDraftStorage } from "./use-draft-storage";

// ════════════════════════════════════════════════════════════════════
// Publish Analysis Form — wizard 2 étapes
//
// Étape 1 "Le pari" : data structurée (match, ligue, pick, cote,
//   teasing, heure, bookmakers, toggle "analyse du jour")
// Étape 2 "L'analyse" : rédaction argumentaire + preview live
//
// Le container gère l'état global du form (un seul objet `draft`
// persisté en sessionStorage via useDraftStorage), le step courant, la
// validation (Zod + check heure-future manuel) et le submit POST /pronos.
// Le JSX de chaque étape vit dans step-1-bet-details / step-2-analysis.
// ════════════════════════════════════════════════════════════════════

const INITIAL_DRAFT: DraftState = {
  matchName: "",
  league: "",
  pick: "",
  odds: "",
  teasing: "",
  argument: "",
  timeRaw: "",
  isFeatured: false,
  bookmakerOdds: {},
  bookmakersOpen: false,
};

export interface PublishAnalysisFormProps {
  bookmakers: Bookmaker[];
  onPublished: (newProno: Prono, updatedProfile: DashboardExpertStats) => void;
}

export function PublishAnalysisForm({ bookmakers, onPublished }: PublishAnalysisFormProps) {
  const { draft, setDraft, clearDraft } = useDraftStorage<DraftState>(INITIAL_DRAFT);
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Error, setStep2Error] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Mutation d'un champ + effacement de son erreur éventuelle (remplace
  // l'ancien couple onX + onClearError).
  function handleChange<K extends keyof DraftState>(field: K, value: DraftState[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
    setStep1Errors((e) => {
      const key = field as keyof Step1Errors;
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function resetForm() {
    setDraft(INITIAL_DRAFT);
    setStep(1);
    setStep1Errors({});
    setStep2Error("");
    setSubmitError("");
    clearDraft();
  }

  // ── Validation étape 1 ──────────────────────────────────────────
  function validateStep1(): boolean {
    const result = step1Schema.safeParse({
      matchName: draft.matchName,
      pick: draft.pick,
      odds: draft.odds,
      teasing: draft.teasing,
      timeRaw: draft.timeRaw,
    });
    const errors: Step1Errors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Step1Errors;
        if (key && !errors[key]) errors[key] = issue.message;
      }
    }
    // "Heure dans le futur" : time-dépendant → hors schéma Zod. Seulement
    // si le format est valide (sinon le message de format prime).
    if (!errors.timeRaw) {
      const t = parseTimeInput(draft.timeRaw);
      if (t) {
        const d = new Date();
        d.setHours(t.hours, t.minutes, 0, 0);
        if (d <= new Date()) errors.timeRaw = "L'heure doit être dans le futur";
      }
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

    const step2Result = step2Schema.safeParse({ argument: draft.argument });
    if (!step2Result.success) {
      setStep2Error(step2Result.error.issues[0].message);
      return;
    }

    const t = parseTimeInput(draft.timeRaw);
    if (!t) {
      // Cas tordu : l'heure a été re-modifiée depuis l'étape 1 (n'arrive
      // pas via l'UI, mais sécurité). Ramène à l'étape 1.
      setStep(1);
      setStep1Errors({ timeRaw: "Format invalide" });
      return;
    }
    const startDate = new Date();
    startDate.setHours(t.hours, t.minutes, 0, 0);

    setSubmitting(true);
    try {
      const bmOddsPayload = Object.entries(draft.bookmakerOdds)
        .filter(([, val]) => val && parseFloat(val) > 1)
        .map(([bookmakerId, val]) => ({ bookmakerId, odds: parseFloat(val) }));

      const newProno = await apiPost<Prono>("/pronos", {
        matchName: draft.matchName,
        league: draft.league || undefined,
        pick: draft.pick,
        odds: parseFloat(draft.odds),
        teasing: draft.teasing,
        argument: draft.argument,
        startTime: startDate.toISOString(),
        isFeatured: draft.isFeatured,
        ...(bmOddsPayload.length > 0 ? { bookmakerOdds: bmOddsPayload } : {}),
      });

      const updatedProfile = await apiGet<DashboardExpertStats>("/experts/me");
      resetForm();
      onPublished(newProno, updatedProfile);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Conteneur : fond noir neutre 2-3 points au-dessus du body bg.
    // Pas de border / shadow / gradient — le contraste vient de la
    // nuance d'élévation. Radius 8px (lg).
    <div className="mx-auto w-full max-w-[1000px] rounded-lg bg-surface-elevated px-5 py-7 md:px-12 md:py-10">
      <Stepper step={step} />

      {step === 1 ? (
        <Step1BetDetails
          values={draft}
          errors={step1Errors}
          bookmakers={bookmakers}
          onChange={handleChange}
          onContinue={handleContinue}
        />
      ) : (
        <Step2Analysis
          values={draft}
          step2Error={step2Error}
          submitError={submitError}
          submitting={submitting}
          onChange={handleChange}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ─── Stepper (1 ─── 2) — éditorial minimaliste ───────────────────────

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
          step === 2 ? "bg-accent" : "bg-border-subtle",
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
