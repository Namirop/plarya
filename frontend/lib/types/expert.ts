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
