import type { MetadataRoute } from "next";

import { API_URL, SITE_URL } from "@/lib/site";

// Shape minimal de l'API GET /experts pour la génération du sitemap.
// On lit juste l'id pour construire l'URL. L'API renvoie aussi
// d'autres champs qu'on ignore ici.
interface ExpertListItem {
  id: string;
}

// Sitemap généré au build-time. Si le backend est down au build,
// fallback sur les pages statiques uniquement (try/catch). Pour
// régénérer à la volée en prod, on pourra passer en ISR (revalidate)
// — pas nécessaire pour le MVP.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/experts`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/devenir-expert`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/cgu`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic : pages experts. Si le fetch backend échoue (build hors-
  // ligne, backend en maintenance), on garde le sitemap fonctionnel
  // avec juste les pages statiques.
  let expertPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/experts?all=true`, {
      // Cache court côté Next : 1h. Empêche de refetch à chaque
      // request si plusieurs crawlers hit /sitemap.xml.
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const experts = (await res.json()) as ExpertListItem[];
      expertPages = experts.map((e) => ({
        url: `${SITE_URL}/experts/${e.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Silent fallback — pas de logging ici car ça polluerait le
    // build. Si le sitemap est incomplet, le crawler reviendra.
  }

  return [...staticPages, ...expertPages];
}
