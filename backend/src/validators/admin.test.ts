import { describe, expect, it } from "vitest";

import { paginationQuerySchema } from "./admin";

describe("paginationQuerySchema", () => {
  it("applique les valeurs par défaut, coerce les strings de query et borne limit/offset", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ limit: 50, offset: 0 });
    expect(paginationQuerySchema.parse({ limit: "10", offset: "20" })).toEqual({
      limit: 10,
      offset: 20,
    });

    for (const query of [{ limit: "0" }, { limit: "201" }, { limit: "1.5" }, { offset: "-1" }]) {
      expect(paginationQuerySchema.safeParse(query).success).toBe(false);
    }
  });
});
