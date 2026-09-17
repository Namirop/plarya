import { z } from "zod";

import { Sport } from "../generated/prisma/enums";

// Commun à tous les schémas `sports` ; 5 au plus pour tenir sur la fiche profil.
export const sportsSchema = z
  .array(z.nativeEnum(Sport))
  .min(1, "Au moins un sport requis")
  .max(5, "Maximum 5 sports");
