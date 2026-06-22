import { z } from "zod";

import { Sport } from "../generated/prisma/enums";

/**
 * Schéma Zod commun pour la liste de sports d'un expert. Utilisé par
 * TOUS les endpoints qui acceptent un array `sports`
 * en entrée — sans cette centralisation, expert-self.ts validait juste
 * `z.array(z.string())` et laissait passer "yoga", "padel", etc.
 *
 * Bornes :
 *  - min(1) : pas de profile expert sans aucun sport (l'UI force le
 *    choix via les chips de /devenir-expert et /compte).
 *  - max(5) : tient sur la fiche profil sans déborder visuellement
 *    (cf. SPORT_LABELS, 9 entrées au total). 5 = expert généraliste
 *    crédible, au-delà ça devient suspect.
 *  - z.nativeEnum(Sport) : strict — uniquement les enums Prisma. Toute
 *    valeur inconnue est rejetée avec un message clair côté Zod.
 */
export const sportsSchema = z
  .array(z.nativeEnum(Sport))
  .min(1, "Au moins un sport requis")
  .max(5, "Maximum 5 sports");
