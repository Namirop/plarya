import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Tout est indexable sauf les espaces connectés et les pages d'authentification.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/compte",
        "/auth",
        // Par précaution, bien que l'API ne serve pas de HTML.
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
