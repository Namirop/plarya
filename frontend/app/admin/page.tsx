import { redirect } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";
import type {
  AdminExpert,
  AdminInitialData,
  AdminUser,
  ExpertRevenue,
  PronosPage,
  RevenueDay,
  SalesPage,
  Stats,
} from "@/lib/types/admin";
import type { AuthUser } from "@/lib/types/auth";

import AdminClient from "./AdminClient";

/**
 * /admin, réservé au rôle ADMIN (redirection vers l'accueil sinon). Les
 * chargements initiaux partent en parallèle ; un échec redirige aussi vers
 * l'accueil plutôt que d'afficher une erreur 500.
 */
const PRONOS_PAGE_SIZE = 50;

export default async function AdminPage() {
  const meRes = await serverFetch("/auth/me");
  if (!meRes.ok) redirect("/");
  const me = (await meRes.json()) as AuthUser;
  if (me.role !== "ADMIN") redirect("/");

  const [statsRes, revenueRes, salesRes, byExpertRes, expertsRes, pronosRes, usersRes] =
    await Promise.all([
      serverFetch("/admin/stats"),
      serverFetch("/admin/stats/revenue"),
      serverFetch("/admin/stats/sales?limit=50"),
      serverFetch("/admin/stats/by-expert"),
      serverFetch("/admin/experts"),
      serverFetch(`/admin/pronos?limit=${PRONOS_PAGE_SIZE}&offset=0`),
      serverFetch("/admin/users"),
    ]);

  if (
    !statsRes.ok ||
    !revenueRes.ok ||
    !salesRes.ok ||
    !byExpertRes.ok ||
    !expertsRes.ok ||
    !pronosRes.ok ||
    !usersRes.ok
  ) {
    redirect("/");
  }

  const [stats, revenueDays, salesPage, expertRevenue, experts, pronos, users] = (await Promise.all(
    [
      statsRes.json(),
      revenueRes.json(),
      salesRes.json(),
      byExpertRes.json(),
      expertsRes.json(),
      pronosRes.json(),
      usersRes.json(),
    ],
  )) as [Stats, RevenueDay[], SalesPage, ExpertRevenue[], AdminExpert[], PronosPage, AdminUser[]];

  const initialData: AdminInitialData = {
    stats,
    revenueDays,
    sales: salesPage.sales,
    salesTotal: salesPage.total,
    expertRevenue,
    experts,
    pronos,
    users,
  };

  return <AdminClient initialData={initialData} />;
}
