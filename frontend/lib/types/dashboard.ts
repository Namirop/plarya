// Types partagés entre l'app dashboard et ses composants. Extraits de
// `app/dashboard/page.tsx` lors de l'éclatement Bloc 2 — la page V1
// déclarait ces interfaces inline. Ils restent fidèles aux réponses
// API actuelles (cf. backend `routes/experts.ts`, `routes/pronos.ts`,
// `routes/bookmakers.ts`).

export interface ExpertProfile {
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
