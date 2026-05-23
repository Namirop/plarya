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
  "Découvre les analyses sportives quotidiennes d'experts vérifiés. Football, tennis, esport et plus.";
