import type { SubscriptionWithExpert } from "@/lib/types/account";

// Card token partagé (header / cards sub / historique / empty state).
export const cardCls = "rounded-2xl border border-surface-elevated bg-black/40";

// Divider neutre — séparateur fin entre lignes de l'historique.
// Anciennement gradient doré, neutralisé (aucun doré sur l'historique).
export const DIVIDER_NEUTRAL_GRADIENT =
  "linear-gradient(to right, transparent 0%, var(--color-surface-elevated) 51%, transparent 100%)";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatPeriod(start: string, end: string): string {
  return `Du ${formatDate(start)} au ${formatDate(end)}`;
}

export function isActiveSubscription(sub: SubscriptionWithExpert): boolean {
  return sub.status === "ACTIVE" && new Date(sub.expiresAt) > new Date();
}
