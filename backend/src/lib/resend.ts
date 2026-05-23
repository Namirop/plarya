import { Resend } from "resend";
import { logger, maskEmail } from "./logger";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const EMAIL_FROM = "Plarya <onboarding@resend.dev>";

const RETRY_DELAYS_MS = [1000, 5000, 30000]; // 1s, 5s, 30s
const MAX_ATTEMPTS = 3;

// Resend SDK return type — `resend.emails.send` retourne
// { data: { id } | null, error: ErrorResponse | null }. Plutôt que
// d'importer le type complet (instable selon les versions du SDK),
// on type le payload via Parameters[0].
type SendPayload = Parameters<typeof resend.emails.send>[0];

/**
 * Détecte les erreurs Resend "permanentes" (4xx pour lesquelles un
 * retry est inutile : bad email, missing API key, etc.) vs
 * "transient" (5xx, network, timeout — un retry peut réussir).
 */
function isPermanentError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { statusCode?: number; name?: string };
  // statusCode est posé par le SDK Resend sur les erreurs HTTP.
  if (typeof e.statusCode === "number") {
    // 400-499 = client error = permanent (sauf 408 timeout et 429 rate-limit)
    return (
      e.statusCode >= 400 && e.statusCode < 500 && e.statusCode !== 408 && e.statusCode !== 429
    );
  }
  // Pas de statusCode → erreur network/timeout → retry.
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Envoie un email via Resend avec retry exponentiel.
 * - 3 tentatives max
 * - Backoff : 1s → 5s → 30s
 * - Skip retry sur erreurs permanentes (bad email, etc.)
 * - Logger structuré sur chaque tentative
 *
 * Pattern fire-and-forget côté appelant : si toutes les tentatives
 * échouent, l'erreur est loggée mais NON propagée par défaut
 * (l'envoi d'email ne doit pas faire échouer le webhook qui l'a
 * déclenché). À l'appelant qui veut différencier de gérer.
 */
export async function sendEmailWithRetry(
  payload: SendPayload,
  context: { kind: string },
): Promise<void> {
  const recipient = Array.isArray(payload.to) ? payload.to[0] : payload.to;
  const maskedTo = maskEmail(typeof recipient === "string" ? recipient : null);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await resend.emails.send(payload);
      // Resend retourne { data, error } au lieu de throw.
      // On normalize en throwing pour la même chaîne de retry.
      if (result.error) {
        throw result.error;
      }
      logger.info(
        { kind: context.kind, to: maskedTo, attempt, resendId: result.data?.id },
        "Email sent",
      );
      return;
    } catch (err) {
      const isLast = attempt === MAX_ATTEMPTS;
      const permanent = isPermanentError(err);
      if (isLast || permanent) {
        logger.error(
          { err, kind: context.kind, to: maskedTo, attempt, permanent },
          "Email send failed (giving up)",
        );
        return; // fire-and-forget : on swallow l'erreur finale
      }
      const delay = RETRY_DELAYS_MS[attempt - 1];
      logger.warn(
        { err, kind: context.kind, to: maskedTo, attempt, nextDelayMs: delay },
        "Email send failed, retrying",
      );
      await sleep(delay);
    }
  }
}
