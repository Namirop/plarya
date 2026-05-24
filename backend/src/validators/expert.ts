import { z } from "zod";

import { sportsSchema } from "./shared";

// Bornes prix (centimes). Cf. audit-final.md §J : sans guard, un
// admin distrait peut set monthlyPrice à 1 et créer une session
// Stripe à 0,01€. min(100)=1€ floor, max(5000)=50€ ceiling pour
// dayPass. min(500)=5€, max(50000)=500€ pour mensuel.
const dayPassPriceSchema = z.number().int().min(100).max(5000);
const monthlyPriceSchema = z.number().int().min(500).max(50000);

export const createExpertSchema = z.object({
  email: z.string().email("Email invalide"),
  pseudo: z.string().min(2).max(30),
  bio: z.string().optional(),
  sports: sportsSchema,
  subStatus: z.enum(["FREE", "ACTIVE"]).optional(),
  // Prix optionnels à la création (Prisma utilise les defaults 350 /
  // 2900 si omis). Validés pour éviter saisie aberrante.
  dayPassPrice: dayPassPriceSchema.optional(),
  monthlyPrice: monthlyPriceSchema.optional(),
});

export const warningSchema = z.object({
  warningMessage: z.string().nullable(),
});

export const displayOrderSchema = z.object({
  displayOrder: z.number().int().min(0),
});

// Params route partagés (admin/experts/:id/*, /experts/:id, etc.).
export const expertIdParamsSchema = z.object({
  id: z.string().cuid("ID expert invalide"),
});

export type CreateExpertInput = z.infer<typeof createExpertSchema>;
export type WarningInput = z.infer<typeof warningSchema>;
export type DisplayOrderInput = z.infer<typeof displayOrderSchema>;
export type ExpertIdParams = z.infer<typeof expertIdParamsSchema>;
