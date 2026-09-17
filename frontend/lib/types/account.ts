import type { UserRole } from "./auth";

/** GET /experts/me (champs utilisés), à ne pas confondre avec PublicExpertProfile. */
export interface OwnExpertProfile {
  id: string;
  pseudo: string;
  bio: string | null;
  dailyNote: string | null;
  dailyNoteDate: string | null;
  sports: string[];
  subscription: {
    status: "FREE" | "ACTIVE" | "EXPIRED";
    active: boolean;
    expiresAt: string | null;
    cancelAtPeriodEnd: boolean;
    canCancel: boolean;
  };
}

/** Élément de GET /subscriptions/me. */
export interface SubscriptionWithExpert {
  id: string;
  userId: string;
  expertId: string;
  type: "DAY_PASS" | "MONTHLY";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  cancelAtPeriodEnd: boolean;
  canCancel: boolean;
  expert: {
    id: string;
    pseudo: string;
    photoUrl: string | null;
    sports: string[];
  };
}

// /compte redirige les ADMIN vers /admin : seuls USER et EXPERT y arrivent.
export type CompteUserRole = Extract<UserRole, "USER" | "EXPERT">;
