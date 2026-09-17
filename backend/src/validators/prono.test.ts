import { describe, expect, it } from "vitest";

import { createPronoSchema, pronoIdParamsSchema, updateResultSchema } from "./prono";

const HOUR_MS = 60 * 60 * 1000;

function validProno(overrides: Record<string, unknown> = {}) {
  return {
    matchName: "PSG - OM",
    pick: "Victoire PSG",
    odds: 1.85,
    teasing: "VALUE",
    startTime: new Date(Date.now() + 24 * HOUR_MS).toISOString(),
    ...overrides,
  };
}

describe("createPronoSchema", () => {
  it("accepte un prono valide et met isFeatured à false par défaut", () => {
    const result = createPronoSchema.safeParse(validProno());
    expect(result.success).toBe(true);
    expect(result.data?.isFeatured).toBe(false);
  });

  it("rejette une cote nulle, négative ou envoyée en string", () => {
    for (const odds of [0, -1.5, "1.85"]) {
      expect(createPronoSchema.safeParse(validProno({ odds })).success).toBe(false);
    }
    const badBookmaker = validProno({ bookmakerOdds: [{ bookmakerId: "winamax", odds: 0 }] });
    expect(createPronoSchema.safeParse(badBookmaker).success).toBe(false);
  });

  it("borne les longueurs : matchName 1..200, argument ≤ 2000", () => {
    expect(createPronoSchema.safeParse(validProno({ matchName: "" })).success).toBe(false);
    expect(createPronoSchema.safeParse(validProno({ matchName: "x".repeat(200) })).success).toBe(
      true,
    );
    expect(createPronoSchema.safeParse(validProno({ matchName: "x".repeat(201) })).success).toBe(
      false,
    );
    expect(createPronoSchema.safeParse(validProno({ argument: "x".repeat(2001) })).success).toBe(
      false,
    );
  });

  it("exige un startTime ISO 8601 situé dans le futur", () => {
    const past = createPronoSchema.safeParse(
      validProno({ startTime: new Date(Date.now() - HOUR_MS).toISOString() }),
    );
    expect(past.success).toBe(false);
    expect(past.error?.issues[0]?.message).toBe("L'heure de début doit être dans le futur");

    const notIso = createPronoSchema.safeParse(validProno({ startTime: "17/09/2030 20:00" }));
    expect(notIso.success).toBe(false);
  });

  it("rejette un teasing hors enum", () => {
    expect(createPronoSchema.safeParse(validProno({ teasing: "BANKER" })).success).toBe(false);
  });
});

describe("updateResultSchema / pronoIdParamsSchema", () => {
  it("n'accepte que WON/LOST comme résultat et un CUID comme id", () => {
    expect(updateResultSchema.safeParse({ result: "WON" }).success).toBe(true);
    expect(updateResultSchema.safeParse({ result: "LOST" }).success).toBe(true);
    expect(updateResultSchema.safeParse({ result: "PENDING" }).success).toBe(false);

    expect(pronoIdParamsSchema.safeParse({ id: "ckprono0000000000000000001" }).success).toBe(true);
    expect(pronoIdParamsSchema.safeParse({ id: "123" }).success).toBe(false);
  });
});
