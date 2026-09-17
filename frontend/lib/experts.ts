import { API_URL } from "@/lib/site";

// Types et chargement serveur du profil public d'un expert.

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

export interface PublicExpertProfile {
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
  /** Suppression de compte programmée : l'API refuse les nouveaux paiements (400). */
  pendingDeletion?: boolean;
  acceptingSubscribers?: boolean;
  pronosToday: number;
  pronos: PronoData[];
}

/** Profil public, revalidé toutes les 60 s (`viewsToday` évolue souvent). */
export async function fetchExpert(id: string): Promise<PublicExpertProfile | null> {
  try {
    const res = await fetch(`${API_URL}/experts/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicExpertProfile;
  } catch {
    return null;
  }
}
