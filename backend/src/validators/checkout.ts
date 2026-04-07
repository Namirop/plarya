import { z } from "zod";

export const createCheckoutSchema = z.object({
  tipsterId: z.string().min(1),
  type: z.enum(["DAY_PASS", "MONTHLY"]),
});
