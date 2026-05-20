import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Accept images from any domain (user-uploaded photos, bookmaker logos)
    // Switch to specific remotePatterns once image hosting is decided
    unoptimized: true,
  },
  // Décalage volontaire entre la nomenclature UI ("expert", cf.
  // CLAUDE.md §1.1) et le code interne historique ("tipster"). On
  // redirige les URLs UI vers les routes internes existantes.
  // `permanent: false` pour pouvoir renommer plus tard sans cache 308.
  async redirects() {
    return [
      { source: "/devenir-expert", destination: "/devenir-tipster", permanent: false },
      // Mapping détaillé /experts/[id] → /tipsters/[id]. /experts (sans
      // id) reste une route propre — stub créé au point 6, à remplacer
      // par la vraie page de listing en phase 5.
      { source: "/experts/:id", destination: "/tipsters/:id", permanent: false },
    ];
  },
};

export default nextConfig;
