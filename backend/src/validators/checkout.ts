import { z } from "zod";

export const createCheckoutSchema = z.object({
  tipsterId: z.string().min(1),
  type: z.enum(["DAY_PASS", "MONTHLY"]),
});

export const becomeTipsterSchema = z.object({
  pseudo: z.string().min(2, "Le pseudo doit contenir au moins 2 caractères"),
  bio: z.string().max(500).optional(),
  sports: z.array(z.string()).min(1, "Sélectionnez au moins un sport"),
});

export const checkSubscriptionSchema = z.object({
  tipsterId: z.string().min(1, "tipsterId requis"),
});
