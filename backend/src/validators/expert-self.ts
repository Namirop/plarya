import { z } from "zod";

// NB : dayPassPrice / monthlyPrice ne sont PAS éditables par l'expert
// lui-même en V1 (cf. backend/src/routes/experts.ts PATCH /experts/me
// qui n'extrait que pseudo/bio/dailyNote/sports). Validateurs présents
// en defensive measure si on ouvre cette capabilité plus tard, avec
// les mêmes bornes que côté admin (validators/expert.ts).
export const updateExpertSchema = z.object({
  pseudo: z.string().min(2).max(30).optional(),
  bio: z.string().max(500).optional(),
  dailyNote: z.string().max(200).optional(),
  sports: z.array(z.string()).min(1).optional(),
  dayPassPrice: z.number().int().min(100).max(5000).optional(),
  monthlyPrice: z.number().int().min(500).max(50000).optional(),
});
