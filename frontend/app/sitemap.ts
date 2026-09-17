import type { MetadataRoute } from "next";

import { API_URL, SITE_URL } from "@/lib/site";
import type { ExpertListItem } from "@/lib/types/expert";

// Pages statiques + profils experts (liste revalidée toutes les heures).
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

  // API indisponible : sitemap limité aux pages statiques.
  let expertPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/experts?all=true`, {
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
    // Volontairement silencieux (évite du bruit dans les logs de build).
  }

  return [...staticPages, ...expertPages];
}
