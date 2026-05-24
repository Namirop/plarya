import { ImageResponse } from "next/og";

import { API_URL, SITE_NAME } from "@/lib/site";

/**
 * OG image dynamique par expert (convention Next App Router :
 * `opengraph-image.tsx` est auto-détecté et exposé en
 * `/experts/[id]/opengraph-image`).
 *
 * Runtime nodejs (et non edge) : en dev sur Windows, fetch undici
 * résout `localhost` en IPv6 (::1) alors que le backend Express
 * écoute en IPv4 (127.0.0.1) → ECONNREFUSED silencieux côté edge.
 * nodejs runtime utilise la résolution DNS classique et reste
 * largement assez performant pour un MVP (cache HTTP Next prend
 * le relais). Quand un crawler social (Twitter, Facebook,
 * LinkedIn, iMessage…) demande l'OG, il reçoit un PNG personnalisé
 * avec le pseudo + bio de l'expert au design DS golden-da.
 *
 * Si le fetch backend échoue (expert introuvable, backend down),
 * on rend un fallback générique "Plarya" plutôt que de planter
 * la génération.
 */

export const runtime = "nodejs";
export const alt = "Profil expert Plarya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ExpertSeo {
  pseudo: string;
  bio: string | null;
}

async function fetchExpert(id: string): Promise<ExpertSeo | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${id}`, {
      // Cache long : l'OG image change rarement (pseudo + bio), donc
      // on peut servir une version cachée 1h. Les crawlers re-fetchent
      // de toute façon à intervalles raisonnables.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      // Log explicite pour distinguer "expert 404" d'un vrai problème
      // (backend down, mauvaise URL). Apparaît dans les logs Next côté
      // serveur, pas dans la response HTTP.
      console.error(`[og-image] fetch ${API_URL}/experts/${id} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as ExpertSeo;
  } catch (err) {
    // ECONNREFUSED / DNS / timeout : on log la cause exacte pour
    // débugger en dev sans casser la génération de l'image.
    console.error(`[og-image] fetch ${API_URL}/experts/${id} threw:`, err);
    return null;
  }
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await fetchExpert(id);

  // Tokens couleurs DS golden-da inlinés (CSS @theme pas dispo côté
  // edge — on hardcode les valeurs canoniques d'app/globals.css).
  const ACCENT = "#dfb968";
  const BACKGROUND = "#000000";
  const SURFACE = "#141414";
  const TEXT_MUTED = "#a1a1aa";

  if (!expert) {
    // Fallback générique — branding Plarya sans expert spécifique.
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

  // Truncate bio pour rester dans la zone visible (la card mockée
  // donne ~60ch en hauteur 32px). Évite que des bios verbeuses
  // débordent et soient coupées sur Twitter/Slack qui affichent
  // l'OG à différentes tailles.
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
      {/* Card centrale style "profil expert" sur fond dark */}
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
        {/* Petit label "EXPERT" en doré */}
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

        {/* Pseudo en grand, blanc */}
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

        {/* Bio si dispo, sinon texte fallback */}
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

        {/* Footer URL */}
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
