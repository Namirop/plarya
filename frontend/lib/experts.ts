import { API_URL } from "@/lib/site";

/**
 * Types + loader server-side partagés du domaine "expert public".
 *
 * Extraits de `app/experts/[id]/ExpertProfile.client.tsx` pour que la
 * page officielle consomme une source de vérité unique — pas de
 * duplication de logique métier (cf. brief redesign card analyse,
 * juin 2026).
 */

export interface BookmakerOddsData {
  id: string;
  odds: number;
  bookmaker: {
    id: string;
    name: string;
    logoUrl: string | null;
    affiliateLinks: { id: string; url: string; label: string | null }[];
  };
}

export interface PronoData {
  id: string;
  matchName: string;
  league: string | null;
  pick: string | null;
  argument: string | null;
  odds: number;
  teasing: string;
  result: "PENDING" | "WON" | "LOST";
  startTime: string;
  isFeatured: boolean;
  matchDate: string | null;
  createdAt: string;
  bookmakerOdds?: BookmakerOddsData[];
}

export interface ExpertProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  photoUrl: string | null;
  sports: string[];
  dayPassPrice: number;
  monthlyPrice: number;
  warningMessage: string | null;
  viewsToday: number;
  /**
   * True si l'expert a programmé la suppression de son compte (cf.
   * Expert.pendingDeletionAt côté backend). Les nouveaux paiements
   * sont refusés (checkout/create-session 400) et le frontend doit
   * désactiver les CTAs d'achat + afficher un banner.
   */
  pendingDeletion?: boolean;
  pronosToday: number;
  pronos: PronoData[];
}

/**
 * Fetch server-side du profil expert public. Le `layout.tsx` fait un
 * fetch similaire pour generateMetadata + JSON-LD Person ; Next dedupe
 * les fetch identiques (même URL + mêmes options) au sein d'une requête
 * → pas de double round-trip à l'API en pratique.
 *
 * Cache court : `viewsToday` du profil bouge plusieurs fois par heure,
 * donc 60s = compromis entre fraîcheur et charge backend.
 */
export async function fetchExpert(id: string): Promise<ExpertProfile | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ExpertProfile;
  } catch {
    return null;
  }
}
