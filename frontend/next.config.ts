import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Optimisation next/image activée (AVIF/WebP, resize, lazy
    // loading natif). On whitelist explicitement les domaines des
    // images qu'on sert :
    //  - thesportsdb.com : logos de ligues (cf. lib/league-logo.ts)
    //  - i.imgur.com & res.cloudinary.com : hébergeurs photo
    //    courants pour les avatars experts uploadés via /devenir-expert
    //    (à étendre quand on choisira un service d'upload officiel).
    //  - www.gravatar.com : fallback éventuel pour les avatars
    //    basés sur l'email.
    //
    // TODO V2 : quand on aura un service d'upload contrôlé (S3,
    // Vercel Blob, Cloudinary), restreindre à ce seul domaine
    // pour éviter le SSRF / hotlinking depuis n'importe quel host.
    remotePatterns: [
      // SportsDB sert ses badges depuis r2.* (Cloudflare R2). Le
      // domaine www.* renvoie l'API JSON, pas les images — c'est bien
      // r2.* qu'il faut whitelister pour next/image.
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
    // Formats modernes servis prioritairement quand le navigateur les
    // accepte (Next négocie via Accept header). AVIF > WebP > original.
    formats: ["image/avif", "image/webp"],
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
