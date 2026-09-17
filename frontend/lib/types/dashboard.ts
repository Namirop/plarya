// Réponses API utilisées par le dashboard expert (/experts/me, /pronos/mine, /bookmakers).

export interface DashboardExpertStats {
  id: string;
  pseudo: string;
  winRate: number;
  pronosToday: number;
}

export interface Prono {
  id: string;
  matchName: string;
  league: string | null;
  pick: string;
  odds: number;
  teasing: string;
  argument: string | null;
  result: "PENDING" | "WON" | "LOST";
  startTime: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface Bookmaker {
  id: string;
  name: string;
  logoUrl: string | null;
  affiliateLinks: { id: string; url: string; label: string | null }[];
}
