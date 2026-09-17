/** Élément de GET /experts (champs utilisés par l'accueil et le sitemap). */
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

/** Champs de GET /experts/:id utilisés pour les métadonnées SEO et l'image Open Graph. */
export interface ExpertSeo {
  id: string;
  pseudo: string;
  bio: string | null;
  photoUrl: string | null;
  sports: string[];
}
