import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Accept images from any domain (user-uploaded photos, bookmaker logos)
    // Switch to specific remotePatterns once image hosting is decided
    unoptimized: true,
  },
  // Backward-compat : les anciennes URLs /tipsters/* et /devenir-tipster
  // (héritage du naming interne "tipster" pré-renommage produit, cf.
  // CLAUDE.md §1.1) sont redirigées en 301 vers les routes canoniques
  // /experts/* et /devenir-expert. Couvre les liens magic-link / Stripe
  // / partages réseaux sociaux générés avant le rename.
  async redirects() {
    return [
      { source: "/devenir-tipster", destination: "/devenir-expert", permanent: true },
      { source: "/tipsters/:id", destination: "/experts/:id", permanent: true },
    ];
  },
};

export default nextConfig;
