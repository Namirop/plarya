import { ImageResponse } from "next/og";

import { API_URL, SITE_NAME } from "@/lib/site";
import type { ExpertSeo } from "@/lib/types/expert";

/**
 * Image Open Graph propre à chaque expert (pseudo, bio), avec une image
 * générique si l'API ne répond pas.
 *
 * Runtime nodejs plutôt qu'edge : en local sous Windows, le runtime edge
 * résout `localhost` en IPv6 (::1) alors que l'API écoute en IPv4, d'où un
 * ECONNREFUSED.
 */

export const runtime = "nodejs";
export const alt = "Profil expert Plarya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function fetchExpert(id: string): Promise<ExpertSeo | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      // Journalisé côté serveur pour distinguer un 404 d'une panne de l'API.
      console.error(`[og-image] fetch ${API_URL}/experts/${id} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as ExpertSeo;
  } catch (err) {
    // Erreur réseau : journalisée, l'image générique est rendue.
    console.error(`[og-image] fetch ${API_URL}/experts/${id} threw:`, err);
    return null;
  }
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await fetchExpert(id);

  // Couleurs en dur : ImageResponse n'a pas accès aux variables CSS.
  const ACCENT = "#dfb968";
  const BACKGROUND = "#000000";
  const SURFACE = "#141414";
  const TEXT_MUTED = "#a1a1aa";

  if (!expert) {
    return new ImageResponse(
      <div
        style={{
          width: size.width,
          height: size.height,
          background: `linear-gradient(135deg, ${BACKGROUND} 0%, ${SURFACE} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 96, color: ACCENT, letterSpacing: "0.08em", display: "flex" }}>
          {SITE_NAME.toUpperCase()}
        </div>
        <div style={{ fontSize: 32, color: TEXT_MUTED, display: "flex" }}>
          Analyses sportives par des experts
        </div>
      </div>,
      size,
    );
  }

  // Bio tronquée pour tenir dans la zone visible de l'image.
  const truncatedBio =
    expert.bio && expert.bio.length > 140 ? `${expert.bio.slice(0, 137)}…` : expert.bio;

  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        background: `linear-gradient(135deg, ${BACKGROUND} 0%, ${SURFACE} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 32,
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: ACCENT,
            letterSpacing: "0.2em",
            display: "flex",
          }}
        >
          EXPERT PLARYA
        </div>

        <div
          style={{
            fontSize: 96,
            color: "#ffffff",
            fontWeight: 700,
            lineHeight: 1.05,
            display: "flex",
          }}
        >
          {expert.pseudo}
        </div>

        <div
          style={{
            fontSize: 32,
            color: TEXT_MUTED,
            lineHeight: 1.35,
            maxWidth: 1000,
            display: "flex",
          }}
        >
          {truncatedBio ?? "Analyses sportives premium sur Plarya."}
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            color: ACCENT,
            letterSpacing: "0.1em",
            display: "flex",
          }}
        >
          plarya.com
        </div>
      </div>
    </div>,
    size,
  );
}
