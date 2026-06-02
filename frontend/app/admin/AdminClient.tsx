"use client";

import { useCallback, useState } from "react";

import { Wallet, ChartLineUp, ShoppingCart, UsersThree } from "@phosphor-icons/react";

import { ConfirmModal } from "@/components/admin/confirm-modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type {
  AdminInitialData,
  AdminExpert,
  AdminProno,
  AdminUser,
  ExpertRevenue,
  PronosPage,
  RevenueDay,
  Sale,
  SalesPage,
  Stats,
} from "@/lib/types/admin";
import { cn } from "@/lib/utils";

import { ByExpertSection } from "./_components/ByExpertSection";
import { ExpertsSection } from "./_components/ExpertsSection";
import { PronosSection } from "./_components/PronosSection";
import { RevenueSection } from "./_components/RevenueSection";
import { SalesSection } from "./_components/SalesSection";
import { UsersSection } from "./_components/UsersSection";

type Tab = "revenus" | "ventes" | "par-expert" | "experts" | "pronos" | "users";

const TABS: { key: Tab; label: string }[] = [
  { key: "revenus", label: "Revenus" },
  { key: "ventes", label: "Ventes" },
  { key: "par-expert", label: "Par expert" },
  { key: "experts", label: "Experts" },
  { key: "pronos", label: "Analyses" },
  { key: "users", label: "Users" },
];

const PRONOS_PAGE_SIZE = 50;

/**
 * Orchestrateur client du panel admin.
 *
 * Reçoit toutes les data initiales du server component (`page.tsx`)
 * et les distribue aux _components/*Section.tsx. Centralise :
 *  - le state global (data + toast)
 *  - la pagination des pronos
 *  - les modales de confirmation (send-emails, override-result)
 *  - les fetchers de refresh appelés après mutation
 *
 * Volontairement gardé monolithique (~280 lignes au lieu de 1146
 * avant la refacto) : centralise la coordination cross-section ; chaque
 * section reste indépendante côté rendering.
 */
export default function AdminClient({ initialData }: { initialData: AdminInitialData }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("revenus");

  // Tous les states miroirs des initial data — les mutations doivent
  // appeler `fetchAll()` pour rester synchronisées avec le backend.
  const [stats, setStats] = useState<Stats>(initialData.stats);
  const [revenueDays, setRevenueDays] = useState<RevenueDay[]>(initialData.revenueDays);
  const [sales, setSales] = useState<Sale[]>(initialData.sales);
  const [salesTotal, setSalesTotal] = useState(initialData.salesTotal);
  const [expertRevenue, setExpertRevenue] = useState<ExpertRevenue[]>(initialData.expertRevenue);
  const [experts, setExperts] = useState<AdminExpert[]>(initialData.experts);
  const [pronos, setPronos] = useState<AdminProno[]>(initialData.pronos.items);
  const [pronosOffset, setPronosOffset] = useState(initialData.pronos.meta.offset);
  const [pronosTotal, setPronosTotal] = useState(initialData.pronos.meta.total);
  const [users, setUsers] = useState<AdminUser[]>(initialData.users);

  const [emailStatus, setEmailStatus] = useState("");
  const [sendEmailsConfirmOpen, setSendEmailsConfirmOpen] = useState(false);
  const [pendingOverride, setPendingOverride] = useState<{
    pronoId: string;
    result: "WON" | "LOST";
  } | null>(null);

  // Refetch ciblé de la page de pronos courante (utilisé par
  // pagination + après mutation override). Garde l'offset courant
  // sauf si caller passe une nouvelle valeur.
  const fetchPronosPage = useCallback(async (offset: number) => {
    try {
      const data = await apiGet<PronosPage>(
        `/admin/pronos?limit=${PRONOS_PAGE_SIZE}&offset=${offset}`,
      );
      setPronos(data.items);
      setPronosTotal(data.meta.total);
      setPronosOffset(data.meta.offset);
    } catch {
      /* silent */
    }
  }, []);

  // Refetch GLOBAL — déclenché après une mutation qui peut impacter
  // plusieurs sections (override prono → stats + by-expert + winRate
  // expert). Coût acceptable côté admin (faible fréquence d'usage).
  const fetchAll = useCallback(async () => {
    try {
      const [s, rd, sl, tr, t, p, u] = await Promise.all([
        apiGet<Stats>("/admin/stats"),
        apiGet<RevenueDay[]>("/admin/stats/revenue"),
        apiGet<SalesPage>("/admin/stats/sales?limit=50"),
        apiGet<ExpertRevenue[]>("/admin/stats/by-expert"),
        apiGet<AdminExpert[]>("/admin/experts"),
        apiGet<PronosPage>(`/admin/pronos?limit=${PRONOS_PAGE_SIZE}&offset=${pronosOffset}`),
        apiGet<AdminUser[]>("/admin/users"),
      ]);
      setStats(s);
      setRevenueDays(rd);
      setSales(sl.sales);
      setSalesTotal(sl.total);
      setExpertRevenue(tr);
      setExperts(t);
      setPronos(p.items);
      setPronosTotal(p.meta.total);
      setPronosOffset(p.meta.offset);
      setUsers(u);
    } catch {
      /* silent */
    }
  }, [pronosOffset]);

  async function executeSendEmails() {
    setEmailStatus("Envoi...");
    try {
      await apiPost<{ message: string }>("/admin/send-daily-emails", {});
      setEmailStatus("Emails J+1 envoyés !");
      showToast("Emails J+1 envoyés à tous les destinataires", "success");
    } catch (err) {
      setEmailStatus("Erreur lors de l'envoi");
      showToast(err instanceof Error ? err.message : "Erreur lors de l'envoi", "error");
    }
    setTimeout(() => setEmailStatus(""), 3000);
  }

  async function executeOverrideResult(pronoId: string, result: "WON" | "LOST") {
    try {
      await apiPatch(`/admin/pronos/${pronoId}/result`, { result });
      // Update optimiste local : permet à l'UI de refléter le
      // changement immédiatement, fetchAll() ensuite resync l'état complet.
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? { ...p, result } : p)));
      showToast(`Analyse marquée comme ${result === "WON" ? "gagnée" : "perdue"}`, "success");
      fetchAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Impossible de modifier le résultat", "error");
    }
  }

  function handleOverrideResult(pronoId: string, result: "WON" | "LOST") {
    setPendingOverride({ pronoId, result });
  }

  // ── KPIs computés depuis revenueDays (cohérent avec V1) ──
  const now = new Date();
  const currentMonthDays = revenueDays.filter((d) => {
    const date = new Date(d.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthRevenue = currentMonthDays.reduce((s, d) => s + d.revenue, 0);
  const monthSales = currentMonthDays.reduce((s, d) => s + d.salesCount, 0);
  const totalRevenue = revenueDays.reduce((s, d) => s + d.revenue, 0);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6 md:pt-16 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-body text-[28px] font-bold text-foreground md:text-[32px]">
            Panneau Admin
          </h1>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setSendEmailsConfirmOpen(true)}
          >
            {emailStatus || "Envoyer emails J+1"}
          </Button>
        </div>

        <div className="mt-10 flex flex-col gap-4 md:mt-12 md:flex-row">
          <StatCard
            icon={Wallet}
            label="CA total (30j)"
            value={formatPrice(totalRevenue)}
            suffix="€"
          />
          <StatCard
            icon={ChartLineUp}
            label="CA ce mois"
            value={formatPrice(monthRevenue)}
            suffix="€"
          />
          <StatCard icon={ShoppingCart} label="Ventes ce mois" value={monthSales} />
          <StatCard
            icon={UsersThree}
            label="Abonnements actifs"
            value={stats.activeSubscriptionsCount}
          />
        </div>

        <div className="mt-10 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-surface-elevated [scrollbar-width:none] md:mt-12 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-3",
                "font-body text-body-16 transition-colors duration-200",
                tab === t.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "revenus" && <RevenueSection revenueDays={revenueDays} />}
          {tab === "ventes" && <SalesSection sales={sales} total={salesTotal} />}
          {tab === "par-expert" && <ByExpertSection expertRevenue={expertRevenue} />}
          {tab === "experts" && <ExpertsSection experts={experts} onUpdate={fetchAll} />}
          {tab === "pronos" && (
            <PronosSection
              pronos={pronos}
              onOverride={handleOverrideResult}
              offset={pronosOffset}
              total={pronosTotal}
              pageSize={PRONOS_PAGE_SIZE}
              onPageChange={fetchPronosPage}
            />
          )}
          {tab === "users" && <UsersSection users={users} />}
        </div>
      </div>

      {/* ─── Modales de confirmation globales ─── */}
      <ConfirmModal
        open={sendEmailsConfirmOpen}
        onClose={() => setSendEmailsConfirmOpen(false)}
        onConfirm={executeSendEmails}
        title="Envoyer les emails J+1"
        description="Cette action envoie un email à tous les utilisateurs concernés. L'envoi est irréversible."
        confirmLabel="Envoyer les emails"
      />
      <ConfirmModal
        open={!!pendingOverride}
        onClose={() => setPendingOverride(null)}
        onConfirm={async () => {
          if (!pendingOverride) return;
          await executeOverrideResult(pendingOverride.pronoId, pendingOverride.result);
        }}
        title="Modifier le résultat de l'analyse"
        description={
          pendingOverride
            ? `Cette action modifie le winRate du expert et peut impacter les payouts. Marquer l'analyse comme ${
                pendingOverride.result === "WON" ? "gagnée" : "perdue"
              } ?`
            : ""
        }
        confirmLabel="Confirmer le changement"
      />
    </>
  );
}
