import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resendAccessUnlockedSchema = z.object({
  // Stripe checkout session id (cs_xxx) — retrouvé dans l'URL du
  // retour Stripe ?stripe_session_id=cs_xxx puis transmis ici par
  // le bouton "Renvoyer" de la modale email-gate.
  stripeSessionId: z.string().min(1, "stripeSessionId requis"),
});

export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
export type ResendAccessUnlockedInput = z.infer<typeof resendAccessUnlockedSchema>;
