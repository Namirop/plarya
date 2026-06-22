import { z } from "zod";

import { sportsSchema } from "./shared";

// NB : dayPassPrice / monthlyPrice ne sont PAS éditables par l'expert
// lui-même en V1 — seul l'admin les fixe (cf. validators/expert.ts).
// On ne les expose donc pas dans ce schéma (YAGNI : on les rajoutera
// si/quand PATCH /experts/me ouvre cette capabilité).
//
// Sprint Polish B2.2 — `sports` partage maintenant le schéma strict
// `sportsSchema` (z.nativeEnum(Sport) + bornes min/max). Avant, on
// acceptait z.array(z.string()) et un expert pouvait PATCH "yoga"
// sans rejet à la validation.
export const updateExpertSchema = z.object({
  pseudo: z.string().min(2).max(30).optional(),
  bio: z.string().max(500).optional(),
  dailyNote: z.string().max(200).optional(),
  sports: sportsSchema.optional(),
});

export type UpdateExpertInput = z.infer<typeof updateExpertSchema>;
