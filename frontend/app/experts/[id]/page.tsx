import { notFound } from "next/navigation";

import { fetchExpert } from "@/lib/experts";

import { ExpertProfileClient } from "./ExpertProfile.client";

export default async function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
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
