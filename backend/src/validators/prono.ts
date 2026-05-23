import { z } from "zod";

const bookmakerOddsItemSchema = z.object({
  bookmakerId: z.string().min(1, "ID bookmaker requis"),
  odds: z.number().positive("La cote doit être positive"),
});

export const createPronoSchema = z.object({
  matchName: z.string().min(1, "Nom du match requis").max(200),
  league: z.string().max(100).optional(),
  pick: z.string().min(1, "Pick requis").max(200),
  odds: z.number().positive("Cote doit être positive"),
  teasing: z.enum([
    "PICK_SOLIDE",
    "VALUE",
    "SAFE",
    "OPPORTUNITE",
    "PICK_DU_JOUR",
    "A_NE_PAS_RATER",
  ]),
  argument: z.string().max(2000).optional(),
  startTime: z
    .string()
    .datetime("Format de date invalide")
    .refine((val) => new Date(val) > new Date(), "L'heure de début doit être dans le futur"),
  isFeatured: z.boolean().optional().default(false),
  matchDate: z.string().datetime().optional(),
  bookmakerOdds: z.array(bookmakerOddsItemSchema).optional(),
});

export const updateResultSchema = z.object({
  result: z.enum(["WON", "LOST"]),
});
