"use client";

import type { CompteUserRole, OwnExpertProfile, SubscriptionWithExpert } from "@/lib/types/account";

import { ExpertView } from "./_components/expert-view";
import { UserView } from "./_components/user-view";

interface CompteClientProps {
  role: CompteUserRole;
  initialExpertProfile: OwnExpertProfile | null;
  initialSubscriptions: SubscriptionWithExpert[] | null;
}

/** Choisit la vue expert ou utilisateur selon le rôle ; chaque vue porte son propre état. */
export default function CompteClient({
  role,
  initialExpertProfile,
  initialSubscriptions,
}: CompteClientProps) {
  if (role === "EXPERT" && initialExpertProfile) {
    return <ExpertView initial={initialExpertProfile} />;
  }
  return <UserView subscriptions={initialSubscriptions ?? []} />;
}
