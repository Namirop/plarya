// Types partagés entre l'app dashboard et ses composants. Extraits de
// `app/dashboard/page.tsx` lors de l'éclatement Bloc 2 — la page V1
// déclarait ces interfaces inline. Ils restent fidèles aux réponses
// API actuelles (cf. backend `routes/tipsters.ts`, `routes/pronos.ts`,
// `routes/bookmakers.ts`).

export interface TipsterProfile {
  id: string;
  pseudo: string;
  winRate: number;
  /** Legacy V1, conservé pour rétro-compatibilité backend — non affiché
   *  (CLAUDE.md §6 retire les streaks de l'UI publique et interne). */
  streak: number;
  streakBadge: string;
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

export interface PublishFormFieldErrors {
  matchName?: string;
  pick?: string;
  odds?: string;
  teasing?: string;
  startTime?: string;
}
