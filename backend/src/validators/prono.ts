import { z } from "zod";

export const createPronoSchema = z.object({
  matchName: z.string().min(1, "Nom du match requis"),
  league: z.string().optional(),
  pick: z.string().min(1, "Pick requis"),
  odds: z.number().positive("Cote doit être positive"),
  teasing: z.enum([
    "PICK_SOLIDE",
    "VALUE",
    "SAFE",
    "OPPORTUNITE",
    "PICK_DU_JOUR",
    "A_NE_PAS_RATER",
  ]),
  argument: z.string().optional(),
  matchDate: z.string().datetime().optional(),
});

export const updateResultSchema = z.object({
  result: z.enum(["WON", "LOST"]),
});
