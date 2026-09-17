import { describe, expect, it } from "vitest";

import { updateExpertSchema } from "./expert-self";

describe("updateExpertSchema (PATCH /experts/me)", () => {
  it("accepte un patch vide ou partiel (tous les champs sont optionnels)", () => {
    expect(updateExpertSchema.safeParse({}).success).toBe(true);
    expect(updateExpertSchema.safeParse({ dailyNote: "Grosse soirée de LDC" }).success).toBe(true);
  });

  it("ne laisse pas l'expert modifier ses prix (champs retirés au parse)", () => {
    const result = updateExpertSchema.safeParse({
      bio: "Nouvelle bio",
      dayPassPrice: 1,
      monthlyPrice: 1,
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ bio: "Nouvelle bio" });
  });

  it("borne bio ≤ 500, dailyNote ≤ 200, pseudo 2..30 et sports à l'enum", () => {
    expect(updateExpertSchema.safeParse({ bio: "x".repeat(500) }).success).toBe(true);
    const invalid = [
      { bio: "x".repeat(501) },
      { dailyNote: "x".repeat(201) },
      { pseudo: "x" },
      { pseudo: "x".repeat(31) },
      { sports: ["PADEL"] },
    ];
    for (const payload of invalid) {
      expect(updateExpertSchema.safeParse(payload).success).toBe(false);
    }
  });
});
