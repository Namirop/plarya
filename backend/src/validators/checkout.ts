import { z } from "zod";

import { sportsSchema } from "./shared";

export const createCheckoutSchema = z.object({
  expertId: z.string().cuid(),
  type: z.enum(["DAY_PASS", "MONTHLY"]),
  email: z.string().email().optional(),
});

// `sports` aligné sur sportsSchema (z.nativeEnum +
// bornes). Avant, become-expert acceptait n'importe quelle string,
// puis le metadata Stripe JSON était envoyé tel quel → la validation
// stricte tombait seulement dans le webhook.
// Désormais on rejette en amont, avant même de créer la session Stripe.
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
