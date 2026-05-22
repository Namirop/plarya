import { notFound } from "next/navigation";
import { API_URL } from "@/lib/site";
import {
  ExpertProfileClient,
  type ExpertProfile,
} from "./ExpertProfile.client";

// Fetch server-side du profil expert. Le layout.tsx fait un fetch
// similaire pour generateMetadata + JSON-LD Person ; Next dedupe les
// fetch identiques (même URL + même options) au sein d'une requête
// → pas de double round-trip à l'API en pratique.
async function fetchExpert(id: string): Promise<ExpertProfile | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${id}`, {
      // Cache court : viewsToday du profil bouge plusieurs fois par
      // heure, donc 60s = compromis entre fraîcheur et charge backend.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ExpertProfile;
  } catch {
    return null;
  }
}

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = await fetchExpert(id);

  // notFound() rend la page 404 Next (app/not-found.tsx si présent,
  // sinon le 404 default). Bénéfice SEO : status 404 effectif vs
  // 200 avec contenu "Expert introuvable" qui pollue l'index Google.
  if (!expert) {
    notFound();
  }

  return <ExpertProfileClient initialExpert={expert} />;
}
