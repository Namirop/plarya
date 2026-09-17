import { z } from "zod";

import { sportsSchema } from "./shared";

// Profil modifiable par l'expert lui-même : les prix n'en font pas partie.
export const updateExpertSchema = z.object({
  pseudo: z.string().min(2).max(30).optional(),
  bio: z.string().max(500).optional(),
  dailyNote: z.string().max(200).optional(),
  sports: sportsSchema.optional(),
});

export type UpdateExpertInput = z.infer<typeof updateExpertSchema>;
