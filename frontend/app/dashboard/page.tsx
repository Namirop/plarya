import { redirect } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";
import type { AuthUser } from "@/lib/types/auth";
import type { Bookmaker, Prono, ExpertProfile } from "@/lib/types/dashboard";

import DashboardClient from "./DashboardClient";

/**
 * Server component /dashboard.
 *
 * Réservé aux EXPERT. USER → redirect /. ADMIN → redirect /admin (le
 * panel admin contient ses propres outils, /dashboard est expert-only).
 *
 * Fetch initial : profile expert + ses pronos + bookmakers. Si l'un
 * des 3 endpoints renvoie 404 (cas où user.role=EXPERT mais pas de
 * row Expert créée — anomalie DB), on tombe sur le redirect /
 * par sécurité.
 */
export default async function DashboardPage() {
  const meRes = await serverFetch("/auth/me");
  if (!meRes.ok) redirect("/");
  const me = (await meRes.json()) as AuthUser;

  if (me.role === "ADMIN") redirect("/admin");
  if (me.role !== "EXPERT") redirect("/");

  const [profileRes, pronosRes, bookmakersRes] = await Promise.all([
    serverFetch("/experts/me"),
    serverFetch("/pronos/mine"),
    serverFetch("/bookmakers"),
  ]);

  if (!profileRes.ok || !pronosRes.ok || !bookmakersRes.ok) {
    redirect("/");
  }

  const [profile, pronos, bookmakers] = (await Promise.all([
    profileRes.json(),
    pronosRes.json(),
    bookmakersRes.json(),
  ])) as [ExpertProfile, Prono[], Bookmaker[]];

  return (
    <DashboardClient
      initialProfile={profile}
      initialPronos={pronos}
      initialBookmakers={bookmakers}
    />
  );
}
