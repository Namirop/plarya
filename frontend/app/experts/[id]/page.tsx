import { notFound } from "next/navigation";

import { fetchExpert } from "@/lib/experts";

import { ExpertProfileClient } from "./ExpertProfile.client";

export default async function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await fetchExpert(id);

  // Vrai statut 404 (app/not-found.tsx) plutôt qu'une page 200 indexable.
  if (!expert) {
    notFound();
  }

  return <ExpertProfileClient initialExpert={expert} />;
}
