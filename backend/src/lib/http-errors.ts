import type { Response } from "express";

import { logger } from "./logger";
import { ServiceError } from "../services/errors";

/**
 * Helper de mapping erreur métier → réponse HTTP.
 *
 * Centralise la logique "ServiceError = renvoie code+httpStatus,
 * autre = log + 500 générique". Sans ce helper, chaque handler répèterait
 * le même switch sur les types d'erreur et le message de log.
 *
 * Le `route` est inclus dans le log pour pouvoir filtrer côté agrégateur
 * (Datadog/Logflare) les erreurs par endpoint.
 *
 * Le `fallbackMessage` (optionnel) personnalise le message client en
 * cas de 500 inattendu. Par défaut "Erreur serveur" — overridable par
 * les routes qui ont historiquement renvoyé un message plus
 * descriptif (ex: "Erreur lors de la création du paiement" sur
 * /checkout). Ne change PAS le log : seul l'affichage côté API.
 *
 * Usage type dans un handler :
 *   try {
 *     const result = await myService.doSomething();
 *     res.json(result);
 *   } catch (err) {
 *     handleError(err, res, "POST /pronos");
 *   }
 */
export function handleError(
  err: unknown,
  res: Response,
  route: string,
  fallbackMessage = "Erreur serveur",
): void {
  if (err instanceof ServiceError) {
    res.status(err.httpStatus).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Tout le reste = erreur inattendue (bug, DB down, …) → log structuré
  // avec la stack + 500 générique au client (pas de leak d'info interne).
  logger.error({ err, route }, "Unhandled error in route");
  res.status(500).json({ error: fallbackMessage });
}
