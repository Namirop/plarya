import { afterEach, describe, expect, it, vi } from "vitest";

// cookies.ts lit NODE_ENV / COOKIE_SAMESITE / COOKIE_DOMAIN à l'import :
// chaque cas recharge le module avec un env stubbé.
async function loadCookies(env: {
  NODE_ENV?: string;
  COOKIE_SAMESITE?: string;
  COOKIE_DOMAIN?: string;
}) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", env.NODE_ENV ?? "test");
  vi.stubEnv("COOKIE_SAMESITE", env.COOKIE_SAMESITE);
  vi.stubEnv("COOKIE_DOMAIN", env.COOKIE_DOMAIN);
  return import("./cookies");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

describe("options de cookies", () => {
  it("par défaut (dev) : lax, non-secure, host-only, session 30 jours", async () => {
    const { sessionCookieOptions } = await loadCookies({});
    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: undefined,
      maxAge: THIRTY_DAYS_MS,
      path: "/",
    });
  });

  it("en production : secure activé, sameSite lax conservé", async () => {
    const { sessionCookieOptions, csrfCookieOptions } = await loadCookies({
      NODE_ENV: "production",
    });
    expect(sessionCookieOptions()).toMatchObject({ secure: true, sameSite: "lax" });
    expect(csrfCookieOptions()).toMatchObject({ secure: true, sameSite: "lax" });
  });

  it("COOKIE_SAMESITE=None (insensible à la casse) force secure même hors prod", async () => {
    const { sessionCookieOptions } = await loadCookies({ COOKIE_SAMESITE: "None" });
    expect(sessionCookieOptions()).toMatchObject({ sameSite: "none", secure: true });
  });

  it("COOKIE_DOMAIN est propagé à la session, au CSRF et au clear", async () => {
    const { sessionCookieOptions, csrfCookieOptions, clearCookieOptions } = await loadCookies({
      COOKIE_DOMAIN: ".plarya.com",
    });
    expect(sessionCookieOptions().domain).toBe(".plarya.com");
    expect(csrfCookieOptions().domain).toBe(".plarya.com");
    expect(clearCookieOptions().domain).toBe(".plarya.com");
  });

  it("CSRF lisible en JS, et clear aligné sur les attributs de pose", async () => {
    const { sessionCookieOptions, csrfCookieOptions, clearCookieOptions } = await loadCookies({
      NODE_ENV: "production",
      COOKIE_SAMESITE: "strict",
      COOKIE_DOMAIN: "",
    });
    expect(csrfCookieOptions().httpOnly).toBe(false);

    const session = sessionCookieOptions();
    expect(clearCookieOptions()).toEqual({
      path: session.path,
      domain: undefined,
      sameSite: "strict",
      secure: true,
    });
  });
});
