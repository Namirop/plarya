import { afterEach, describe, expect, it, vi } from "vitest";

import { isDemoLoginEnabled, isDemoRole, isValidDemoKey } from "./demo-login";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDemoRole", () => {
  it("accepte uniquement les rôles démo expert et user", () => {
    expect(isDemoRole("expert")).toBe(true);
    expect(isDemoRole("user")).toBe(true);
  });

  it("rejette admin, la casse différente et les valeurs non-string", () => {
    for (const value of ["admin", "ADMIN", "Expert", "", 42, null, undefined, ["user"]]) {
      expect(isDemoRole(value)).toBe(false);
    }
  });
});

describe("isDemoLoginEnabled", () => {
  it('n\'est actif que si ENABLE_DEMO_LOGIN vaut exactement "true"', () => {
    vi.stubEnv("ENABLE_DEMO_LOGIN", undefined);
    expect(isDemoLoginEnabled()).toBe(false);
    vi.stubEnv("ENABLE_DEMO_LOGIN", "TRUE");
    expect(isDemoLoginEnabled()).toBe(false);
    vi.stubEnv("ENABLE_DEMO_LOGIN", "true");
    expect(isDemoLoginEnabled()).toBe(true);
  });
});

describe("isValidDemoKey", () => {
  it("est fail-closed quand DEMO_LOGIN_SECRET n'est pas configuré", () => {
    vi.stubEnv("DEMO_LOGIN_SECRET", undefined);
    expect(isValidDemoKey("n-importe-quoi")).toBe(false);
    vi.stubEnv("DEMO_LOGIN_SECRET", "");
    expect(isValidDemoKey("")).toBe(false);
  });

  it("rejette une clé absente ou vide", () => {
    vi.stubEnv("DEMO_LOGIN_SECRET", "s3cr3t-demo");
    expect(isValidDemoKey(undefined)).toBe(false);
    expect(isValidDemoKey("")).toBe(false);
  });

  it("rejette une clé de longueur différente sans lever d'exception", () => {
    vi.stubEnv("DEMO_LOGIN_SECRET", "s3cr3t-demo");
    expect(isValidDemoKey("s3cr3t")).toBe(false);
    expect(isValidDemoKey("s3cr3t-demo-plus-long")).toBe(false);
    // Même nombre de caractères mais pas d'octets ("é" = 2 octets en UTF-8).
    vi.stubEnv("DEMO_LOGIN_SECRET", "abc");
    expect(() => isValidDemoKey("abé")).not.toThrow();
    expect(isValidDemoKey("abé")).toBe(false);
  });

  it("rejette une mauvaise clé de même longueur et accepte la bonne", () => {
    vi.stubEnv("DEMO_LOGIN_SECRET", "s3cr3t-demo");
    expect(isValidDemoKey("s3cr3t-dem0")).toBe(false);
    expect(isValidDemoKey("s3cr3t-demo")).toBe(true);
  });
});
