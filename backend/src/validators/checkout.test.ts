import { describe, expect, it } from "vitest";

import { becomeExpertSchema, createCheckoutSchema } from "./checkout";

const EXPERT_ID = "ckexpert000000000000000001";

describe("createCheckoutSchema", () => {
  it("accepte DAY_PASS et MONTHLY, email optionnel", () => {
    expect(createCheckoutSchema.safeParse({ expertId: EXPERT_ID, type: "DAY_PASS" }).success).toBe(
      true,
    );
    expect(
      createCheckoutSchema.safeParse({
        expertId: EXPERT_ID,
        type: "MONTHLY",
        email: "acheteur@example.com",
      }).success,
    ).toBe(true);
  });

  it("rejette un type inconnu, un expertId non-CUID ou un email invalide", () => {
    const invalid = [
      { expertId: EXPERT_ID, type: "YEARLY" },
      { expertId: EXPERT_ID, type: "day_pass" },
      { expertId: "expert-1", type: "DAY_PASS" },
      { expertId: EXPERT_ID, type: "MONTHLY", email: "pas-un-email" },
    ];
    for (const payload of invalid) {
      expect(createCheckoutSchema.safeParse(payload).success).toBe(false);
    }
  });
});

describe("becomeExpertSchema", () => {
  it("valide pseudo (≥ 2), bio (≤ 500) et sports (enum Prisma, 1 à 5)", () => {
    const base = { pseudo: "Zizou", sports: ["FOOTBALL", "TENNIS"] };
    expect(becomeExpertSchema.safeParse(base).success).toBe(true);
    expect(becomeExpertSchema.safeParse({ ...base, bio: "x".repeat(500) }).success).toBe(true);

    expect(becomeExpertSchema.safeParse({ ...base, pseudo: "Z" }).success).toBe(false);
    expect(becomeExpertSchema.safeParse({ ...base, bio: "x".repeat(501) }).success).toBe(false);
    expect(becomeExpertSchema.safeParse({ ...base, sports: [] }).success).toBe(false);
    expect(becomeExpertSchema.safeParse({ ...base, sports: ["YOGA"] }).success).toBe(false);
    expect(
      becomeExpertSchema.safeParse({
        ...base,
        sports: ["FOOTBALL", "TENNIS", "BASKETBALL", "RUGBY", "HOCKEY", "MMA"],
      }).success,
    ).toBe(false);
  });
});
