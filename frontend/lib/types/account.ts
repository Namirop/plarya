import type { UserRole } from "./auth";

/**
 * Profil expert tel que renvoyé par GET /experts/me (vue propriétaire).
 * Subset des champs exposés au propriétaire du profil — ne pas confondre
 * avec PublicExpertProfile (lib/types/expert.ts si créé un jour).
 */
export interface ExpertProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: string | null;
  sports: string[];
}

/**
 * Subscription d'un user avec l'expert lié, telle que renvoyée par
 * GET /subscriptions/me.
 */
export interface SubscriptionWithExpert {
  id: string;
  userId: string;
  expertId: string;
  type: "DAY_PASS" | "MONTHLY";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  expert: {
    id: string;
    pseudo: string;
    photoUrl: string | null;
    sports: string[];
  };
}

// Note : le rôle dans CompteClient se limite à USER ou EXPERT
// (les ADMIN sont redirigés vers /admin en amont). On ne réutilise donc
// pas UserRole directement pour le prop `role` de CompteClient.
export type CompteUserRole = Extract<UserRole, "USER" | "EXPERT">;
