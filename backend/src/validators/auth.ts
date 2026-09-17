import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resendAccessUnlockedSchema = z.object({
  // ID de session Checkout (cs_…), lu dans l'URL de retour Stripe.
  stripeSessionId: z.string().min(1, "stripeSessionId requis"),
});

export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
export type ResendAccessUnlockedInput = z.infer<typeof resendAccessUnlockedSchema>;
