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

// Publication d'une analyse en deux étapes : le pari (match, pick, cote,
// heure, cotes bookmakers…) puis l'argumentaire, sous un récapitulatif.
// Ce composant porte le brouillon (conservé en sessionStorage), la validation
// et l'envoi POST /pronos ; chaque étape a son composant.

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

  // Modifier un champ efface son erreur.
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
    // Heure future : dépend de l'instant présent, donc hors du schéma Zod.
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
      // Garde-fou, non atteignable par l'interface : retour à l'étape 1.
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

// ─── Indicateur d'étape (1 ─── 2) ────────────────────────────────────

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
