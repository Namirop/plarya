import { describe, expect, it } from "vitest";

import {
  activeExpertSubscriptionWhere,
  EXPERT_SUB_GRACE_MS,
  isExpertSubscriptionActive,
} from "./expert-access";

const NOW = new Date("2026-09-17T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("isExpertSubscriptionActive", () => {
  it("accepte un compte expert offert (FREE), sans échéance", () => {
    expect(isExpertSubscriptionActive({ subStatus: "FREE", subExpiresAt: null }, NOW)).toBe(true);
  });

  it("refuse un abonnement arrêté (EXPIRED), même avec une échéance future", () => {
    const future = new Date(NOW.getTime() + 30 * DAY);
    expect(isExpertSubscriptionActive({ subStatus: "EXPIRED", subExpiresAt: future }, NOW)).toBe(
      false,
    );
  });

  it("accepte un abonnement ACTIVE dont l'échéance n'est pas passée", () => {
    const future = new Date(NOW.getTime() + DAY);
    expect(isExpertSubscriptionActive({ subStatus: "ACTIVE", subExpiresAt: future }, NOW)).toBe(
      true,
    );
  });

  it("laisse un délai de grâce après l'échéance, le temps du renouvellement Stripe", () => {
    const justPast = new Date(NOW.getTime() - 2 * DAY);
    expect(isExpertSubscriptionActive({ subStatus: "ACTIVE", subExpiresAt: justPast }, NOW)).toBe(
      true,
    );
  });

  it("refuse un abonnement ACTIVE dont l'échéance dépasse le délai de grâce", () => {
    const longPast = new Date(NOW.getTime() - EXPERT_SUB_GRACE_MS - DAY);
    expect(isExpertSubscriptionActive({ subStatus: "ACTIVE", subExpiresAt: longPast }, NOW)).toBe(
      false,
    );
  });

  it("accepte un abonnement ACTIVE sans échéance (créé par l'admin)", () => {
    expect(isExpertSubscriptionActive({ subStatus: "ACTIVE", subExpiresAt: null }, NOW)).toBe(true);
  });
});

describe("activeExpertSubscriptionWhere", () => {
  it("reprend les mêmes règles en filtre Prisma, avec la même borne de grâce", () => {
    const where = activeExpertSubscriptionWhere(NOW);
    expect(where.OR).toEqual([
      { subStatus: "FREE" },
      { subStatus: "ACTIVE", subExpiresAt: null },
      { subStatus: "ACTIVE", subExpiresAt: { gt: new Date(NOW.getTime() - EXPERT_SUB_GRACE_MS) } },
    ]);
  });
});
