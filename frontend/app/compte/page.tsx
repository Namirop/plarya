import { redirect } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";
import type { ExpertProfile, SubscriptionWithExpert } from "@/lib/types/account";
import type { AuthUser } from "@/lib/types/auth";

import CompteClient from "./CompteClient";

/**
 * Server component /compte.
 *
 * Pattern :
 *  1. Resolve session via /auth/me (cookie session_token forwardé).
 *  2. Si non auth (401) → redirect /. Si role=ADMIN → redirect /admin
 *     (admin n'a pas de "mon compte", il gère son user via /admin).
 *  3. Selon le rôle, fetch les data complémentaires :
 *     - USER  → /subscriptions/me (liste abonnements + day-passes)
 *     - EXPERT → /experts/me (profil pseudo/bio/sports/dailyNote)
 *  4. Render CompteClient avec les initial data en props → le HTML
 *     initial sert directement le contenu (pas de spinner client).
 *
 * Pas de fetch dupliqué côté client : CompteClient init ses states
 * depuis les props, useEffect de fetch initial supprimé.
 */
export default async function ComptePage() {
  const meRes = await serverFetch("/auth/me");
  if (!meRes.ok) {
    redirect("/");
  }
  const me = (await meRes.json()) as AuthUser;

  if (me.role === "ADMIN") {
    redirect("/admin");
  }

  let initialExpertProfile: ExpertProfile | null = null;
  let initialSubscriptions: SubscriptionWithExpert[] | null = null;

  if (me.role === "EXPERT") {
    const res = await serverFetch("/experts/me");
    if (res.ok) {
      initialExpertProfile = (await res.json()) as ExpertProfile;
    }
  } else {
    // USER
    const res = await serverFetch("/subscriptions/me");
    if (res.ok) {
      initialSubscriptions = (await res.json()) as SubscriptionWithExpert[];
    } else {
      initialSubscriptions = [];
    }
  }

  return (
    <CompteClient
      role={me.role}
      initialExpertProfile={initialExpertProfile}
      initialSubscriptions={initialSubscriptions}
    />
  );
}
