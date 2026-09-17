import { z } from "zod";

import { sportsSchema } from "./shared";

// Bornes de prix en centimes (pass jour 1–50 €, mensuel 5–500 €) : évite une
// session Stripe à un montant aberrant.
const dayPassPriceSchema = z.number().int().min(100).max(5000);
const monthlyPriceSchema = z.number().int().min(500).max(50000);

export const createExpertSchema = z.object({
  email: z.string().email("Email invalide"),
  pseudo: z.string().min(2).max(30),
  bio: z.string().optional(),
  sports: sportsSchema,
  subStatus: z.enum(["FREE", "ACTIVE"]).optional(),
  // Limite connue : validés mais non transmis par createExpertAccount, les
  // valeurs par défaut du schéma Prisma (350 / 2900) s'appliquent.
  dayPassPrice: dayPassPriceSchema.optional(),
  monthlyPrice: monthlyPriceSchema.optional(),
});

export const warningSchema = z.object({
  warningMessage: z.string().nullable(),
});

export const displayOrderSchema = z.object({
  displayOrder: z.number().int().min(0),
});

// Paramètre `:id` des routes expert.
export const expertIdParamsSchema = z.object({
  id: z.string().cuid("ID expert invalide"),
});

export type CreateExpertInput = z.infer<typeof createExpertSchema>;
export type WarningInput = z.infer<typeof warningSchema>;
export type DisplayOrderInput = z.infer<typeof displayOrderSchema>;
export type ExpertIdParams = z.infer<typeof expertIdParamsSchema>;
