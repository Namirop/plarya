import { z } from "zod";

export const subscriptionIdParamsSchema = z.object({
  id: z.string().cuid("ID d'abonnement invalide"),
});
