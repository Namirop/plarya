import { redirect } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";
import type { AuthUser } from "@/lib/types/auth";
import type { Bookmaker, Prono, DashboardExpertStats } from "@/lib/types/dashboard";

import DashboardClient from "./DashboardClient";

/**
 * /dashboard, réservé aux experts (ADMIN → /admin, autres → accueil). Profil,
 * pronos et bookmakers sont chargés côté serveur ; un échec de l'un d'eux
 * redirige vers l'accueil.
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
  ])) as [DashboardExpertStats, Prono[], Bookmaker[]];

  return (
    <DashboardClient
      initialProfile={profile}
      initialPronos={pronos}
      initialBookmakers={bookmakers}
    />
  );
}
