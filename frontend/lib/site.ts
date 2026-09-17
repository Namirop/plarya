// URL publique du site, sans slash final : base des URL SEO (canonical,
// sitemap, robots, JSON-LD). Variables NEXT_PUBLIC_*, figées au build.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const SITE_NAME = "Plarya";
export const SITE_DESCRIPTION =
  "Découvre les analyses sportives quotidiennes d'experts. Football, tennis, esport et plus.";

// Sérialise un objet JSON-LD pour un <script> inline. `JSON.stringify`
// n'échappe pas `<` : une bio contenant `</script>` fermerait la balise et
// injecterait du HTML. `\u003c` reste du JSON valide pour les moteurs.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
