import Image from "next/image";

import type { SubscriptionWithExpert } from "@/lib/types/account";
import { cn } from "@/lib/utils";

/** Photo de l'expert, ou son initiale à défaut. */
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
