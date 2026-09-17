import { describe, expect, it } from "vitest";

import { escapeHtml } from "./format";

describe("escapeHtml", () => {
  it("échappe les cinq caractères HTML sensibles", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#039;");
  });

  it("neutralise une injection de balises sans double-échapper les entités", () => {
    expect(escapeHtml(`</strong><script>alert("x")</script>`)).toBe(
      "&lt;/strong&gt;&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    // "&" est traité en premier : une entité déjà présente est ré-échappée
    // une seule fois (pas de "&amp;amp;lt;").
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("laisse inchangée une chaîne sans caractère spécial", () => {
    expect(escapeHtml("Pronos du jour — Élodie_42")).toBe("Pronos du jour — Élodie_42");
    expect(escapeHtml("")).toBe("");
  });
});
