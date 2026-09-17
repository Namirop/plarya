import { redirect } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";
import type { OwnExpertProfile, SubscriptionWithExpert } from "@/lib/types/account";
import type { AuthUser } from "@/lib/types/auth";

import CompteClient from "./CompteClient";

/**
 * /compte, rendu côté serveur : sans session → accueil, ADMIN → /admin.
 * Les données du rôle (/experts/me ou /subscriptions/me) sont chargées ici et
 * passées à CompteClient, sans chargement initial côté client.
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

  let initialExpertProfile: OwnExpertProfile | null = null;
  let initialSubscriptions: SubscriptionWithExpert[] | null = null;

  if (me.role === "EXPERT") {
    const res = await serverFetch("/experts/me");
    if (res.ok) {
      initialExpertProfile = (await res.json()) as OwnExpertProfile;
    }
  } else {
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
