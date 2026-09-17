import { HomePageClient } from "./HomePage.client";

// Composant serveur minimal : les sections de l'accueil chargent leurs
// données côté client.
export default function HomePage() {
  return <HomePageClient />;
}
