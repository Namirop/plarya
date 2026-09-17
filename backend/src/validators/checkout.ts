import { z } from "zod";

import { sportsSchema } from "./shared";

export const createCheckoutSchema = z.object({
  expertId: z.string().cuid(),
  type: z.enum(["DAY_PASS", "MONTHLY"]),
  email: z.string().email().optional(),
});

// Validé avant la création de la session Stripe : le profil transite par les
// metadata jusqu'au webhook qui crée l'expert.
export const becomeExpertSchema = z.object({
  pseudo: z.string().min(2, "Le pseudo doit contenir au moins 2 caractères"),
  bio: z.string().max(500).optional(),
  sports: sportsSchema,
});

export const checkSubscriptionSchema = z.object({
  expertId: z.string().cuid("expertId invalide"),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type BecomeExpertInput = z.infer<typeof becomeExpertSchema>;
export type CheckSubscriptionInput = z.infer<typeof checkSubscriptionSchema>;
