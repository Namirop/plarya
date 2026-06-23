/**
 * Item de la liste publique des experts renvoyée par GET /experts.
 * Subset minimal — pour la shape complète des données expert, cf.
 * lib/experts.ts (page profil publique).
 */
export interface ExpertListItem {
  id: string;
  pseudo: string;
  photoUrl: string | null;
  sports: string[];
  viewsToday: number;
  todayPronos: {
    matchName: string;
    isFeatured: boolean;
    startTime: string;
    result: "PENDING" | "WON" | "LOST";
  }[];
}

/**
 * Subset des données expert renvoyé par GET /experts/:id, utilisé pour
 * les metadata SEO (layout.tsx) et la génération de l'OG image
 * (opengraph-image.tsx). L'OG image n'en lit qu'une partie (pseudo +
 * bio) ; le layout utilise tout (JSON-LD Person). Pas exposé au runtime UI.
 */
export interface ExpertSeo {
  id: string;
  pseudo: string;
  bio: string | null;
  photoUrl: string | null;
  sports: string[];
}
