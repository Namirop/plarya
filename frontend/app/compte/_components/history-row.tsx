import Link from "next/link";

import type { SubscriptionWithExpert } from "@/lib/types/account";

import { formatDate, formatPeriod } from "../_helpers";
import { ExpertAvatar } from "./expert-avatar";

export function HistoryRow({ sub }: { sub: SubscriptionWithExpert }) {
  const isMonthly = sub.type === "MONTHLY";
  return (
    <div className="flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.02] md:px-6 md:py-5">
      <ExpertAvatar expert={sub.expert} size="sm" />

      <div className="min-w-0 flex-1">
        <Link
          href={`/experts/${sub.expertId}`}
          className="truncate font-body text-body-18 text-foreground transition-colors hover:underline underline-offset-4"
        >
          {sub.expert.pseudo}
        </Link>
        <p className="font-body text-body-16 text-muted-foreground">
          {isMonthly
            ? `Mensuel · ${formatPeriod(sub.createdAt, sub.expiresAt)}`
            : `Journée · ${formatDate(sub.createdAt)}`}
        </p>
      </div>

      <p className="shrink-0 font-body text-body-18 text-foreground">{isMonthly ? "29€" : "3,50€"}</p>
    </div>
  );
}
