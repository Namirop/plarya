import { Suspense } from "react";
import { DevenirExpertClient } from "./DevenirExpert.client";

// page.tsx server component. Pas de fetch SSR initial (toute la
// logique dépend de la session côté client via useUser). Suspense
// boundary nécessaire pour useSearchParams() du DevenirExpertClient
// (Next exige Suspense quand un client component lit des query
// params à l'intérieur d'un server component).
export default function DevenirExpertPage() {
  return (
    <Suspense>
      <DevenirExpertClient />
    </Suspense>
  );
}
