import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

// En dev : pino-pretty pour output lisible coloré dans la console.
// En prod : JSON brut une-ligne-par-event pour ingestion par
// Datadog / Logflare / etc. (chaque champ devient une dimension
// requêtable côté agrégateur).
//
// Logger structuré : préférer logger.info({ field1, field2 }, "message")
// plutôt que logger.info(`message ${field1} ${field2}`) pour que les
// champs soient interrogeables séparément.
//
// PII : NE JAMAIS logger d'email/token bruts. Utiliser maskEmail()
// pour les identifiants utilisateur loggés à des fins de debug.
export const logger = pino({
  level: logLevel,
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

/** Masque un email pour le logging : "user@example.com" → "u***@example.com" */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "<none>";
  const [local, domain] = email.split("@");
  if (!domain) return "<invalid>";
  const masked = local.length <= 1 ? local : `${local[0]}***`;
  return `${masked}@${domain}`;
}
