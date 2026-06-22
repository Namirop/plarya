import Image from "next/image";

import type { SubscriptionWithExpert } from "@/lib/types/account";
import { cn } from "@/lib/utils";

/**
 * Avatar d'un expert (photo ou initiale fallback). Réutilisé par
 * ActiveSubscriptionCard et HistoryRow.
 */
export function ExpertAvatar({
  expert,
  size = "md",
}: {
  expert: SubscriptionWithExpert["expert"];
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? 40 : 48;
  const sizeCls = size === "sm" ? "size-10" : "size-12";
  if (expert.photoUrl) {
    return (
      <Image
        src={expert.photoUrl}
        alt={expert.pseudo}
        width={dim}
        height={dim}
        className={cn(sizeCls, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  // Avatar fallback neutre — ex `ring-accent/40 text-accent` retiré
  // (anti-pattern : 10 avatars en série historique = série dorée
  // verticale, doré purement décoratif sans signal métier).
  return (
    <div
      className={cn(
        sizeCls,
        "flex shrink-0 items-center justify-center rounded-full bg-surface-elevated font-body text-h5 font-bold text-foreground",
      )}
    >
      {expert.pseudo.charAt(0).toUpperCase()}
    </div>
  );
}
