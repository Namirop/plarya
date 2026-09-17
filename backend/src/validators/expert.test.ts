import { describe, expect, it } from "vitest";

import { createExpertSchema } from "./expert";

describe("createExpertSchema (admin)", () => {
  it("borne les prix en centimes : pass jour 100..5000, mensuel 500..50000, entiers", () => {
    const base = { email: "expert@example.com", pseudo: "Zizou", sports: ["FOOTBALL"] };
    const ok = (extra: Record<string, unknown>) =>
      createExpertSchema.safeParse({ ...base, ...extra }).success;

    expect(ok({})).toBe(true);
    expect(ok({ dayPassPrice: 100, monthlyPrice: 50000 })).toBe(true);

    expect(ok({ dayPassPrice: 99 })).toBe(false);
    expect(ok({ dayPassPrice: 5001 })).toBe(false);
    expect(ok({ dayPassPrice: 350.5 })).toBe(false);
    expect(ok({ monthlyPrice: 499 })).toBe(false);
    expect(ok({ monthlyPrice: 50001 })).toBe(false);
  });
});
