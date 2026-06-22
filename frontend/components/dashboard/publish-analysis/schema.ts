import { z } from "zod";

import { parseTimeInput } from "./parse-time-input";

// ════════════════════════════════════════════════════════════════════
// Schémas de validation du wizard de publication.
//
// IMPORTANT : le state du form est entièrement STRING-based (les inputs
// sont des champs texte contrôlés — odds, heure, cotes bookmakers sont
// saisis en texte puis parsés au submit). Les schémas valident donc des
// strings, et les bornes/messages sont repris VERBATIM de l'ancienne
// validation manuelle — aucune nouvelle règle métier introduite.
//
// Champs volontairement NON validés (comme l'ancien code) :
//  - league : optionnel (envoyé `|| undefined` au submit)
//  - bookmakerOdds : optionnels, filtrés (> 1) au submit
//  - isFeatured : booléen libre
//
// La règle "l'heure doit être dans le futur" est time-dépendante
// (compare à `now`) → elle ne peut pas vivre dans un schéma statique.
// Elle reste gérée manuellement dans le container (cf. validateStep1).
// ════════════════════════════════════════════════════════════════════

export const step1Schema = z.object({
  matchName: z.string().trim().min(1, "Le match est requis"),
  pick: z.string().trim().min(1, "Le pick est requis"),
  // parseFloat > 1 (cote minimale). `Boolean(v)` rejette la chaîne vide.
  odds: z.string().refine((v) => {
    const n = parseFloat(v);
    return Boolean(v) && !Number.isNaN(n) && n > 1;
  }, "Cote invalide"),
  teasing: z.string().min(1, "Teasing requis"),
  // Format SEULEMENT (futur géré dans le container).
  timeRaw: z.string().refine((v) => parseTimeInput(v) !== null, "Format invalide"),
});

export const step2Schema = z.object({
  argument: z.string().refine(
    (v) => v.trim().length >= 20,
    "L'analyse doit contenir au moins 20 caractères",
  ),
});

// Contrat complet du form (step1 + step2). Exporté comme source de
// vérité du payload ; le submit valide de façon incrémentale (step1 au
// "Continuer", step2 au "Publier") pour préserver le flow + le check
// time-dépendant.
export const publishAnalysisSchema = step1Schema.merge(step2Schema);

// ─── Types ───────────────────────────────────────────────────────────

// State complet du brouillon (inclut les champs non validés + l'état UI
// `bookmakersOpen`). C'est l'objet persisté en sessionStorage.
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

// Clés d'erreur de l'étape 1 (alignées sur les noms de champs du draft).
export type Step1Errors = Partial<
  Record<"matchName" | "pick" | "odds" | "teasing" | "timeRaw", string>
>;
