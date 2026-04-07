import { z } from "zod";

export const updateTipsterSchema = z.object({
  pseudo: z.string().min(2).optional(),
  bio: z.string().optional(),
  dailyNote: z.string().max(200).optional(),
  sports: z.array(z.string()).min(1).optional(),
});
