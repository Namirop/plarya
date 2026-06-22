"use client";

import type { CompteUserRole, ExpertProfile, SubscriptionWithExpert } from "@/lib/types/account";

import { ExpertView } from "./_components/expert-view";
import { UserView } from "./_components/user-view";

interface CompteClientProps {
  role: CompteUserRole;
  initialExpertProfile: ExpertProfile | null;
  initialSubscriptions: SubscriptionWithExpert[] | null;
}

/**
 * Racine de /compte : aiguille vers la vue EXPERT (profil + note +
 * confidentialité) ou USER (abonnements + historique + confidentialité)
 * selon le rôle. Le state vit dans chaque vue ; ici, simple dispatch.
 */
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
