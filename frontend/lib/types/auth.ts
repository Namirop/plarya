/**
 * Rôles applicatifs alignés avec l'enum Prisma `UserRole` côté backend
 * (cf. backend/prisma/schema.prisma).
 *
 * Mirror manuel : si l'enum backend évolue (ajout d'un rôle), penser à
 * synchroniser ici. Pas de génération auto pour garder le front
 * indépendant du backend en build.
 */
export type UserRole = "USER" | "EXPERT" | "ADMIN";

/**
 * User authentifié tel qu'exposé par GET /auth/me. Forme stable : id,
 * email, role. Champs additionnels potentiels (createdAt, etc.) à
 * ajouter ici plutôt que de redéfinir des `MeUser` ad hoc dans les
 * pages.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
