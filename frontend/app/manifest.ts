import type { MetadataRoute } from "next";

// Manifest servi à /manifest.webmanifest ; icônes dans public/favicon/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plarya — Analyses sportives par des experts",
    short_name: "Plarya",
    description: "Découvre les analyses sportives quotidiennes d'experts vérifiés.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
