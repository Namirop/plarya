import { z } from "zod";

export const createTipsterSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  pseudo: z.string().min(2).max(30),
  bio: z.string().optional(),
  sports: z
    .array(
      z.enum([
        "FOOTBALL",
        "TENNIS",
        "BASKETBALL",
        "RUGBY",
        "HOCKEY",
        "MMA",
        "BOXE",
        "ESPORT",
        "AUTRE",
      ])
    )
    .min(1, "Au moins un sport requis"),
  subStatus: z.enum(["FREE", "ACTIVE"]).optional(),
});

export const warningSchema = z.object({
  warningMessage: z.string().nullable(),
});
