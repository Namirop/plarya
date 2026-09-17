import { afterEach, describe, expect, it, vi } from "vitest";

// FRONTEND_URL est lu à l'import du module : on recharge le module après
// avoir stubbé l'env.
async function loadTemplates(frontendUrl?: string) {
  vi.resetModules();
  vi.stubEnv("FRONTEND_URL", frontendUrl);
  return import("./email-templates");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const XSS_PSEUDO = `</strong><script>alert(1)</script>`;

describe("buildAccessUnlockedEmail", () => {
  it("échappe le pseudo expert (user-controlled) dans le HTML", async () => {
    const { buildAccessUnlockedEmail } = await loadTemplates("https://plarya.test");
    const { html } = buildAccessUnlockedEmail({
      expertPseudo: XSS_PSEUDO,
      expertId: "ckexpert000000000000000001",
      magicLinkUrl: "https://api.plarya.test/auth/verify?token=abc",
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;/strong&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('href="https://api.plarya.test/auth/verify?token=abc"');
  });
});

describe("buildWinningPronoEmail", () => {
  it("retire le slash final de FRONTEND_URL et échappe le nom du match", async () => {
    const { buildWinningPronoEmail } = await loadTemplates("https://plarya.test///");
    const { html } = buildWinningPronoEmail({
      expertPseudo: "Expert",
      expertId: "ckexpert000000000000000001",
      matchName: `PSG <img src=x onerror="alert(1)">`,
    });

    expect(html).toContain('href="https://plarya.test/experts/ckexpert000000000000000001"');
    expect(html).toContain('src="https://plarya.test/email-logo.png"');
    expect(html).not.toContain("plarya.test//");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("PSG &lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});
