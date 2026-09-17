import { z } from "zod";

import { parseTimeInput } from "./parse-time-input";

// Validation du formulaire de publication. Tous les champs sont saisis en
// texte (cote, heure) et convertis à l'envoi, d'où des schémas sur des
// chaînes. Non validés ici : league et isFeatured (libres), bookmakerOdds
// (filtrés à l'envoi). L'heure future est vérifiée dans validateStep1.

export const step1Schema = z.object({
  matchName: z.string().trim().min(1, "Le match est requis"),
  pick: z.string().trim().min(1, "Le pick est requis"),
  // Cote strictement supérieure à 1.
  odds: z.string().refine((v) => {
    const n = parseFloat(v);
    return Boolean(v) && !Number.isNaN(n) && n > 1;
  }, "Cote invalide"),
  teasing: z.string().min(1, "Teasing requis"),
  // Format seulement.
  timeRaw: z.string().refine((v) => parseTimeInput(v) !== null, "Format invalide"),
});

export const step2Schema = z.object({
  argument: z
    .string()
    .refine((v) => v.trim().length >= 20, "L'analyse doit contenir au moins 20 caractères"),
});

// Schéma complet ; le formulaire valide étape par étape (« Continuer », « Publier »).
export const publishAnalysisSchema = step1Schema.merge(step2Schema);

// ─── Types ───────────────────────────────────────────────────────────

// Brouillon conservé en sessionStorage, état d'interface compris (bookmakersOpen).
export interface DraftState {
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

export type Step1Errors = Partial<
  Record<"matchName" | "pick" | "odds" | "teasing" | "timeRaw", string>
>;
