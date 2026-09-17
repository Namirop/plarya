// Copie manuelle de l'enum Prisma UserRole : le frontend ne dépend pas du
// backend au build, toute évolution de l'enum est à reporter ici.
export type UserRole = "USER" | "EXPERT" | "ADMIN";

/** Réponse de GET /auth/me. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
