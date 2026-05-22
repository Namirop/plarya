import { z } from "zod";

export const updateExpertSchema = z.object({
  pseudo: z.string().min(2).max(30).optional(),
  bio: z.string().max(500).optional(),
  dailyNote: z.string().max(200).optional(),
  sports: z.array(z.string()).min(1).optional(),
});
