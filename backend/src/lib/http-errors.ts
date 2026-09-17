import type { Response } from "express";

import { logger } from "./logger";
import { ServiceError } from "../services/errors";

/**
 * Traduit une erreur en réponse HTTP : `ServiceError` → son statut et son
 * `code` ; toute autre erreur → log structuré (avec `route`) + 500 générique.
 * `fallbackMessage` ne change que le message renvoyé au client en cas de 500.
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

  // Erreur inattendue : la stack reste dans les logs, jamais dans la réponse.
  logger.error({ err, route }, "Unhandled error in route");
  res.status(500).json({ error: fallbackMessage });
}
