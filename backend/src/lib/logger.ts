import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

// JSON une ligne par événement en production, pino-pretty en développement.
// Passer les données en champs (`logger.info({ id }, "msg")`) et ne jamais
// logger d'email ou de token en clair (voir maskEmail).
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
