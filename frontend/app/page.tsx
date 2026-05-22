import { HomePageClient } from "./HomePage.client";

// page.tsx server component : pas de fetch SSR initial pour l'instant
// (les composants enfants ExpertsSection / DomainsSection gèrent leur
// propre fetch client-side). Le shell server permet une future
// migration de fetch SSR + le metadata root (layout.tsx) reste
// efficace puisque la chain est purement server jusqu'au boundary
// HomePageClient.
export default function HomePage() {
  return <HomePageClient />;
}
