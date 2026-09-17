import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hôtes autorisés pour next/image : badges de ligues TheSportsDB (servis
    // depuis r2.*) et hébergeurs d'avatars. Limite connue : sans service
    // d'upload dédié, la liste inclut des hébergeurs d'images génériques.
    remotePatterns: [
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Alias permanents des URL /tipsters et /devenir-tipster.
      { source: "/devenir-tipster", destination: "/devenir-expert", permanent: true },
      { source: "/tipsters/:id", destination: "/experts/:id", permanent: true },
      // La liste des experts est sur l'accueil. `source` exact : les profils
      // /experts/[id] ne sont pas redirigés.
      { source: "/experts", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
