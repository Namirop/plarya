import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// robots.txt généré par Next à /robots.txt. Indexable par défaut
// sauf les zones connectées (admin, dashboard, compte) et les flows
// auth (verify, callbacks). Le sitemap est référencé pour faciliter
// la découverte par Google/Bing.
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
        // Les endpoints API ne devraient pas être crawlés non plus
        // (ils ne servent pas du HTML, mais par défense).
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
