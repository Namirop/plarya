import { describe, expect, it, vi } from "vitest";

// logger.ts instancie pino à l'import (transport pino-pretty hors prod,
// donc un worker thread) : on le remplace par un stub pour garder le
// test pur et rapide. maskEmail ne dépend pas de pino.
vi.mock("pino", () => ({ default: vi.fn(() => ({})) }));

import { maskEmail } from "./logger";

describe("maskEmail", () => {
  it("masque la partie locale en gardant la 1re lettre et le domaine", () => {
    expect(maskEmail("user@example.com")).toBe("u***@example.com");
  });

  it("laisse intacte une partie locale d'un seul caractère", () => {
    expect(maskEmail("a@example.com")).toBe("a@example.com");
  });

  it('renvoie "<none>" pour null, undefined ou une chaîne vide', () => {
    expect(maskEmail(null)).toBe("<none>");
    expect(maskEmail(undefined)).toBe("<none>");
    expect(maskEmail("")).toBe("<none>");
  });

  it('renvoie "<invalid>" quand il n\'y a pas de domaine', () => {
    expect(maskEmail("pas-un-email")).toBe("<invalid>");
    expect(maskEmail("user@")).toBe("<invalid>");
  });
});
