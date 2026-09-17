import { Resend } from "resend";
import { logger, maskEmail } from "./logger";

const resend = new Resend(process.env.RESEND_API_KEY!);

// EMAIL_FROM doit utiliser un domaine vérifié chez Resend. L'adresse de repli
// `onboarding@resend.dev` ne délivre qu'au titulaire du compte Resend.
export const EMAIL_FROM = process.env.EMAIL_FROM || "Plarya <onboarding@resend.dev>";

const RETRY_DELAYS_MS = [1000, 5000, 30000]; // 1s, 5s, 30s
const MAX_ATTEMPTS = 3;

// Type dérivé de la signature du SDK, plus stable qu'un import de ses types internes.
type SendPayload = Parameters<typeof resend.emails.send>[0];

/**
 * Erreur permanente = 4xx hors 408/429 (adresse invalide, clé absente…) :
 * inutile de réessayer. Sans statusCode (réseau, timeout), on réessaie.
 */
function isPermanentError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { statusCode?: number; name?: string };
  if (typeof e.statusCode === "number") {
    return (
      e.statusCode >= 400 && e.statusCode < 500 && e.statusCode !== 408 && e.statusCode !== 429
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Envoie un email via Resend : 3 tentatives au plus, sans nouvel essai sur
 * erreur permanente. L'échec final est journalisé mais jamais propagé, pour
 * qu'un email ne fasse pas échouer le webhook ou la route appelante.
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
      // Le SDK renvoie `{ data, error }` sans lever : on lève pour unifier.
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
        return;
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
