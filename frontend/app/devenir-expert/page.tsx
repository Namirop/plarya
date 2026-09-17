import { Suspense } from "react";

import { DevenirExpertClient } from "./DevenirExpert.client";

// La page dépend de la session côté client. Suspense est requis par Next pour
// useSearchParams() dans DevenirExpertClient.
export default function DevenirExpertPage() {
  return (
    <Suspense>
      <DevenirExpertClient />
    </Suspense>
  );
}
