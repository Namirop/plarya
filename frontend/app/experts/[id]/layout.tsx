import type { Metadata } from "next";
import { API_URL, SITE_NAME, SITE_URL } from "@/lib/site";

// Shape minimal de la réponse GET /experts/:id qu'on utilise pour
// la metadata + le JSON-LD. Les autres champs sont ignorés ici.
interface ExpertSeo {
  id: string;
  pseudo: string;
  bio: string | null;
  photoUrl: string | null;
  sports: string[];
}

async function fetchExpertForSeo(id: string): Promise<ExpertSeo | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${id}`, {
      // Cache 1h côté Next : équilibre fraîcheur (changement de bio
      // par l'expert) vs charge backend (crawlers + visiteurs SEO).
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ExpertSeo;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const expert = await fetchExpertForSeo(id);

  // Fallback si le fetch échoue (backend down au build, expert
  // introuvable, etc.). On garde un titre/description génériques.
  if (!expert) {
    return {
      title: "Profil expert",
      description: `Découvre les analyses sportives sur ${SITE_NAME}.`,
    };
  }

  const title = `${expert.pseudo} — Analyses sportives`;
  // Bio peut être longue : on truncate à 120 chars pour rester dans
  // les limites de description SEO (~155 chars max recommandés).
  const description = expert.bio
    ? `${expert.pseudo} partage ses analyses sportives sur ${SITE_NAME}. ${expert.bio.slice(0, 120)}`
    : `Découvre les analyses sportives de ${expert.pseudo} sur ${SITE_NAME}.`;
  const canonical = `${SITE_URL}/experts/${expert.id}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "profile",
      url: canonical,
      images: expert.photoUrl ? [{ url: expert.photoUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: expert.photoUrl ? [expert.photoUrl] : undefined,
    },
    alternates: {
      canonical,
    },
  };
}

export default async function ExpertProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = await fetchExpertForSeo(id);

  // JSON-LD Person : enrichit les rich results Google sur la page
  // expert (knowsAbout = sports couverts, image, description). Si
  // le fetch échoue, on skip le JSON-LD plutôt que de pousser du
  // schema vide ou incorrect.
  const personLd = expert
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: expert.pseudo,
        url: `${SITE_URL}/experts/${expert.id}`,
        ...(expert.photoUrl ? { image: expert.photoUrl } : {}),
        ...(expert.bio ? { description: expert.bio } : {}),
        ...(expert.sports.length > 0 ? { knowsAbout: expert.sports } : {}),
      }
    : null;

  return (
    <>
      {personLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
      )}
      {children}
    </>
  );
}
