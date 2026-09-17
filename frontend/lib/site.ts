// URL publique du site (sans trailing slash). Sert de base à toute
// la machinerie SEO : metadataBase, canonical URLs, sitemap, robots,
// JSON-LD URLs. Lue depuis NEXT_PUBLIC_SITE_URL (baked au build,
// donc safe à exposer côté client).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// URL de l'API backend (côté serveur pour les fetch SSR, sitemap,
// generateMetadata, etc.). Mêmes règles que SITE_URL.
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
