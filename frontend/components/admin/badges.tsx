import { badgeBaseCls, BADGE_TONES, type BadgeTone } from "@/lib/admin-styles";
import { cn } from "@/lib/utils";

/** Badge résultat de prono : Gagné / Perdu / En attente, couleurs DS. */
export function ResultBadge({ result }: { result: string }) {
  const tone: BadgeTone = result === "WON" ? "success" : result === "LOST" ? "danger" : "muted";
  return (
    <span className={cn(badgeBaseCls, BADGE_TONES[tone])}>
      {result === "WON" ? "Gagné" : result === "LOST" ? "Perdu" : "En attente"}
    </span>
  );
}

/** Badge rôle utilisateur : ADMIN doré, EXPERT vert, USER gris. */
export function RoleBadge({ role }: { role: string }) {
  const tone: BadgeTone = role === "ADMIN" ? "premium" : role === "EXPERT" ? "success" : "muted";
  return <span className={cn(badgeBaseCls, BADGE_TONES[tone])}>{role}</span>;
}
