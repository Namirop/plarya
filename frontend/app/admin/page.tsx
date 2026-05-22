"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost, apiPatch, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { useToast } from "@/components/ui/toast-provider";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ── Types ── */

interface Stats {
  usersCount: number;
  tipstersCount: number;
  pronosCount: number;
  activeSubscriptionsCount: number;
  estimatedRevenueCents: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
  salesCount: number;
}

interface Sale {
  id: string;
  date: string;
  email: string;
  tipsterPseudo: string;
  type: "DAY_PASS" | "MONTHLY";
  amount: number;
}

interface TipsterRevenue {
  tipsterId: string;
  pseudo: string;
  salesCount: number;
  totalRevenue: number;
  tipsterShare: number;
}

interface AdminTipster {
  id: string;
  pseudo: string;
  sports: string[];
  subStatus: string;
  displayOrder: number;
  warningMessage: string | null;
  createdAt: string;
  user: { email: string };
  _count: { pronos: number; subscriptions: number };
}

interface AdminProno {
  id: string;
  matchName: string;
  league: string | null;
  odds: number;
  teasing: string;
  result: "PENDING" | "WON" | "LOST";
  createdAt: string;
  tipster: { pseudo: string };
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { subscriptions: number };
}

/* ── Tabs ── */

type Tab = "revenus" | "ventes" | "par-expert" | "tipsters" | "pronos" | "users";

const TABS: { key: Tab; label: string }[] = [
  { key: "revenus", label: "Revenus" },
  { key: "ventes", label: "Ventes" },
  { key: "par-expert", label: "Par expert" },
  { key: "tipsters", label: "Experts" },
  { key: "pronos", label: "Analyses" },
  { key: "users", label: "Users" },
];

/* ══════════════════ Styles partagés DS ══════════════════ */

// Pattern input compact pour cellules de tableau (px-3 py-2 vs px-4
// py-3 du fieldCls standard). Cohérent avec le focus accent doré.
const fieldClsCompact = cn(
  "w-full rounded-xl border border-surface-elevated bg-black/40 px-3 py-2",
  "font-body text-body-16 text-foreground placeholder:text-muted-foreground/50",
  "transition-colors duration-200",
  "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
);

// Pattern table DS unifié — wrapper rounded-2xl + border + bg-black/40,
// header bg-black/60 (légèrement plus sombre pour distinguer), rows
// border-bottom + hover bg-black/30.
const tableWrapperCls =
  "overflow-hidden rounded-2xl border border-surface-elevated bg-black/40";
const tableScrollCls = "overflow-x-auto";
const tableCls = "w-full text-left";
const theadRowCls = "border-b border-surface-elevated bg-black/60";
const thCls =
  "px-4 py-3 font-body text-body-16 font-normal text-muted-foreground";
const thNumericCls = cn(thCls, "text-right");
const tbodyRowCls =
  "border-b border-surface-elevated last:border-b-0 transition-colors hover:bg-black/30";
const tdCls = "px-4 py-3 font-body text-body-16 text-foreground";
const tdMutedCls = "px-4 py-3 font-body text-body-16 text-muted-foreground";
const tdNumericCls = cn(tdCls, "text-right");

// Pattern badge DS — pill rounded-full, 6 sémantiques.
const badgeBaseCls =
  "inline-flex items-center rounded-full px-3 py-1 font-body text-body-16";

type BadgeTone = "success" | "danger" | "muted" | "premium";
const BADGE_TONES: Record<BadgeTone, string> = {
  success: "bg-green-500/20 text-green-500",
  danger: "bg-red-500/20 text-red-500",
  muted: "bg-muted-foreground/20 text-muted-foreground",
  premium: "bg-accent/20 text-accent",
};

// Card mobile (utilisée dans le double-rendering sm:hidden / hidden sm:block).
const mobileCardCls =
  "rounded-2xl border border-surface-elevated bg-black/40 p-4";

// ── Helpers ──

function EmptyRow({
  cols,
  message = "Aucun résultat",
}: {
  cols: number;
  message?: string;
}) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-4 py-12 text-center font-body text-body-16 italic text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  );
}

function EmptyCard({ message = "Aucun résultat" }: { message?: string }) {
  return (
    <div className={cn(mobileCardCls, "text-center")}>
      <p className="font-body text-body-16 italic text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

/* ══════════════════ Page ══════════════════ */

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("revenus");

  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueDays, setRevenueDays] = useState<RevenueDay[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [tipsterRevenue, setTipsterRevenue] = useState<TipsterRevenue[]>([]);
  const [tipsters, setTipsters] = useState<AdminTipster[]>([]);
  const [pronos, setPronos] = useState<AdminProno[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [emailStatus, setEmailStatus] = useState("");

  // ── Confirmation modale send emails J+1 ──
  const [sendEmailsConfirmOpen, setSendEmailsConfirmOpen] = useState(false);

  // ── Confirmation modale override résultat ──
  // Stocke le PATCH en attente pendant que l'admin confirme. null = pas
  // de confirmation en cours.
  const [pendingOverride, setPendingOverride] = useState<{
    pronoId: string;
    result: "WON" | "LOST";
  } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [s, rd, sl, tr, t, p, u] = await Promise.all([
        apiGet<Stats>("/admin/stats"),
        apiGet<RevenueDay[]>("/admin/stats/revenue"),
        apiGet<{ sales: Sale[]; total: number }>("/admin/stats/sales?limit=50"),
        apiGet<TipsterRevenue[]>("/admin/stats/by-tipster"),
        apiGet<AdminTipster[]>("/admin/tipsters"),
        apiGet<AdminProno[]>("/admin/pronos"),
        apiGet<AdminUser[]>("/admin/users"),
      ]);
      setStats(s); setRevenueDays(rd); setSales(sl.sales); setSalesTotal(sl.total);
      setTipsterRevenue(tr); setTipsters(t); setPronos(p); setUsers(u);
    } catch { /* silent */ } finally { setLoadingData(false); }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") { router.replace("/"); return; }
    fetchAll();
  }, [user, loading, router, fetchAll]);

  if (loading || loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-surface-elevated border-t-accent" />
      </div>
    );
  }

  // ── Action V1 inchangée — extraite en `execute*` pour être appelée
  //    depuis la modale de confirmation après validation admin. Le
  //    feedback inline (emailStatus 3s sur le bouton) reste, doublé
  //    par un toast pour confirmation overlay. ──
  async function executeSendEmails() {
    setEmailStatus("Envoi...");
    try {
      await apiPost<{ message: string }>("/admin/send-daily-emails", {});
      setEmailStatus("Emails J+1 envoyés !");
      showToast("Emails J+1 envoyés à tous les destinataires", "success");
    } catch (err) {
      setEmailStatus("Erreur lors de l'envoi");
      showToast(
        err instanceof Error ? err.message : "Erreur lors de l'envoi",
        "error",
      );
    }
    setTimeout(() => setEmailStatus(""), 3000);
  }

  // Override résultat — état optimiste V1 conservé. Sur succès, on
  // déclenche un fetchAll() pour resync les stats by-tipster + le
  // winRate dérivé (cf. audit §10 piège 5). Sur erreur, toast et on
  // ne touche pas au state (le rollback est implicite : la prochaine
  // navigation/refresh forcera la cohérence).
  async function executeOverrideResult(pronoId: string, result: "WON" | "LOST") {
    try {
      await apiPatch(`/admin/pronos/${pronoId}/result`, { result });
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? { ...p, result } : p)));
      showToast(
        `Analyse marquée comme ${result === "WON" ? "gagnée" : "perdue"}`,
        "success",
      );
      // Refetch ciblé impossible en V1 (pas d'endpoint par-tipster
      // isolé) → fetchAll complet. Cost acceptable côté admin
      // (faible fréquence).
      fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Impossible de modifier le résultat",
        "error",
      );
    }
  }

  // Trigger handlers — ouvrent la modale de confirmation au lieu
  // d'exécuter directement.
  function handleSendEmails() {
    setSendEmailsConfirmOpen(true);
  }

  function handleOverrideResult(pronoId: string, result: "WON" | "LOST") {
    setPendingOverride({ pronoId, result });
  }

  // ── KPIs globaux ──
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
        {/* Header — titre + action globale "Envoyer emails J+1" (ouvre
            désormais une modale de confirmation, cf. Bloc 2 §critiques). */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-h2 text-foreground">Panneau Admin</h1>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSendEmails}
          >
            {emailStatus || "Envoyer emails J+1"}
          </Button>
        </div>

        {/* KPIs globaux */}
        <div className="mt-10 flex flex-col gap-4 md:mt-12 md:flex-row">
          <StatCard icon="solar:wallet-money-bold" label="CA total (30j)" value={formatPrice(totalRevenue)} suffix="€" />
          <StatCard icon="solar:graph-up-bold" label="CA ce mois" value={formatPrice(monthRevenue)} suffix="€" />
          <StatCard icon="solar:cart-3-bold" label="Ventes ce mois" value={monthSales} />
          <StatCard icon="solar:users-group-rounded-bold" label="Abonnements actifs" value={stats?.activeSubscriptionsCount ?? 0} />
        </div>

        {/* Tab bar DS */}
        <div className="mt-10 flex gap-1 overflow-x-auto border-b border-surface-elevated md:mt-12">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-3",
                "font-body text-body-16 transition-colors duration-200",
                tab === t.key
                  ? "border-accent text-accent"
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
          {tab === "par-expert" && <ByTipsterSection tipsterRevenue={tipsterRevenue} />}
          {tab === "tipsters" && <TipstersSection tipsters={tipsters} onUpdate={fetchAll} />}
          {tab === "pronos" && <PronosSection pronos={pronos} onOverride={handleOverrideResult} />}
          {tab === "users" && <UsersSection users={users} />}
        </div>
      </div>

      {/* ─── Modales de confirmation ─── */}
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
            ? `Cette action modifie le winRate du tipster et peut impacter les payouts. Marquer l'analyse comme ${
                pendingOverride.result === "WON" ? "gagnée" : "perdue"
              } ?`
            : ""
        }
        confirmLabel="Confirmer le changement"
      />
    </>
  );
}

/* ══════════════════ Revenue Section ══════════════════ */

function RevenueSection({ revenueDays }: { revenueDays: RevenueDay[] }) {
  // Les KPIs sont rendus globalement (Bloc 1). Ici : chart 30j +
  // bouton export CSV.
  const { showToast } = useToast();
  const now = new Date();
  const maxRevenue = Math.max(...revenueDays.map((d) => d.revenue), 1);

  async function handleExportCSV() {
    try {
      const res = await apiFetch("/admin/stats/export.csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ventes-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Impossible d'exporter le CSV",
        "error",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={handleExportCSV}>
          Exporter les ventes du mois (CSV)
        </Button>
      </div>

      {/* Revenue chart */}
      <div>
        <h3 className="mb-3 font-body text-body-16 text-foreground">
          CA par jour (30 derniers jours)
        </h3>
        <div className="flex h-40 items-end gap-[2px] rounded-2xl border border-surface-elevated bg-black/40 p-3">
          {revenueDays.map((day) => {
            const height = day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 100, 4) : 0;
            const dateObj = new Date(day.date);
            const isToday = dateObj.toDateString() === now.toDateString();
            return (
              <div key={day.date} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-colors group-hover:bg-foreground/50",
                    isToday ? "bg-accent" : "bg-foreground/25",
                  )}
                  style={{ height: `${height}%`, minHeight: day.revenue > 0 ? "2px" : "0" }}
                />
                <div className="absolute bottom-full z-10 mb-1 hidden group-hover:block">
                  <div className="whitespace-nowrap rounded-lg border border-surface-elevated bg-black/90 px-2 py-1 font-body text-body-16 text-foreground shadow-md">
                    {dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {" — "}{formatPrice(day.revenue)}€ ({day.salesCount} vente{day.salesCount > 1 ? "s" : ""})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between px-3 font-body text-body-16 text-muted-foreground">
          <span>{revenueDays[0]?.date.slice(5)}</span>
          <span>{revenueDays[revenueDays.length - 1]?.date.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Sales Section ══════════════════ */

function SalesSection({ sales, total }: { sales: Sale[]; total: number }) {
  return (
    <div className="space-y-4">
      <p className="font-body text-body-16 text-muted-foreground">
        {total} vente{total > 1 ? "s" : ""} au total
      </p>

      {/* Desktop table */}
      <div className={cn("hidden sm:block", tableWrapperCls, tableScrollCls)}>
        <table className={tableCls}>
          <thead>
            <tr className={theadRowCls}>
              <th className={thCls}>Date</th>
              <th className={thCls}>Email</th>
              <th className={thCls}>Expert</th>
              <th className={thCls}>Type</th>
              <th className={thNumericCls}>Montant</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <EmptyRow cols={5} message="Aucune vente enregistrée" />
            ) : (
              sales.map((s) => (
                <tr key={s.id} className={tbodyRowCls}>
                  <td className={tdMutedCls}>
                    {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className={tdCls}>{s.email}</td>
                  <td className={cn(tdCls, "font-medium")}>{s.tipsterPseudo}</td>
                  <td className="px-4 py-3">
                    <span className={cn(badgeBaseCls, s.type === "MONTHLY" ? BADGE_TONES.premium : BADGE_TONES.muted)}>
                      {s.type === "DAY_PASS" ? "Day Pass" : "Mensuel"}
                    </span>
                  </td>
                  <td className={cn(tdNumericCls, "font-medium")}>{formatPrice(s.amount)}€</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {sales.length === 0 ? (
          <EmptyCard message="Aucune vente enregistrée" />
        ) : (
          sales.map((s) => (
            <div key={s.id} className={mobileCardCls}>
              <div className="flex items-center justify-between">
                <p className="font-body text-body-16 font-medium text-foreground">{s.tipsterPseudo}</p>
                <span className="font-body text-body-16 font-medium text-foreground">{formatPrice(s.amount)}€</span>
              </div>
              <p className="mt-1 font-body text-body-16 text-muted-foreground">{s.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-body text-body-16 text-muted-foreground">
                  {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                <span className={cn(badgeBaseCls, s.type === "MONTHLY" ? BADGE_TONES.premium : BADGE_TONES.muted)}>
                  {s.type === "DAY_PASS" ? "Day Pass" : "Mensuel"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════ By Tipster Section ══════════════════ */

function ByTipsterSection({ tipsterRevenue }: { tipsterRevenue: TipsterRevenue[] }) {
  return (
    <div>
      {/* Desktop table */}
      <div className={cn("hidden sm:block", tableWrapperCls, tableScrollCls)}>
        <table className={tableCls}>
          <thead>
            <tr className={theadRowCls}>
              <th className={thCls}>Expert</th>
              <th className={thNumericCls}>Ventes</th>
              <th className={thNumericCls}>CA total</th>
              <th className={thNumericCls}>Part expert (70%)</th>
              <th className={thNumericCls}>Part plateforme (30%)</th>
            </tr>
          </thead>
          <tbody>
            {tipsterRevenue.length === 0 ? (
              <EmptyRow cols={5} message="Aucune donnée pour les experts" />
            ) : (
              tipsterRevenue.map((t) => (
                <tr key={t.tipsterId} className={tbodyRowCls}>
                  <td className={cn(tdCls, "font-medium")}>{t.pseudo}</td>
                  <td className={tdNumericCls}>{t.salesCount}</td>
                  <td className={cn(tdNumericCls, "font-medium")}>{formatPrice(t.totalRevenue)}€</td>
                  <td className={cn(tdNumericCls, "font-medium text-accent")}>{formatPrice(t.tipsterShare)}€</td>
                  <td className={tdMutedCls + " text-right"}>{formatPrice(t.totalRevenue - t.tipsterShare)}€</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {tipsterRevenue.length === 0 ? (
          <EmptyCard message="Aucune donnée pour les experts" />
        ) : (
          tipsterRevenue.map((t) => (
            <div key={t.tipsterId} className={mobileCardCls}>
              <div className="flex items-center justify-between">
                <p className="font-body text-body-16 font-medium text-foreground">{t.pseudo}</p>
                <span className="font-body text-body-16 font-medium text-foreground">{formatPrice(t.totalRevenue)}€</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-body-16 text-muted-foreground">
                <span>{t.salesCount} vente{t.salesCount > 1 ? "s" : ""}</span>
                <span className="font-medium text-accent">Expert : {formatPrice(t.tipsterShare)}€</span>
                <span>Plateforme : {formatPrice(t.totalRevenue - t.tipsterShare)}€</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════ Tipsters Section ══════════════════ */

function TipstersSection({
  tipsters,
  onUpdate,
}: {
  tipsters: AdminTipster[];
  onUpdate: () => void;
}) {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [warningText, setWarningText] = useState("");
  const [orderValues, setOrderValues] = useState<Record<string, number>>({});
  const [orderSaved, setOrderSaved] = useState<string | null>(null);

  useEffect(() => {
    const values: Record<string, number> = {};
    for (const t of tipsters) values[t.id] = t.displayOrder;
    setOrderValues(values);
  }, [tipsters]);

  async function handleSaveWarning(tipsterId: string) {
    try {
      await apiPatch(`/admin/tipsters/${tipsterId}/warning`, { warningMessage: warningText || null });
      setEditingId(null);
      setWarningText("");
      onUpdate();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Impossible d'enregistrer l'avertissement",
        "error",
      );
    }
  }

  async function handleSaveOrder(tipsterId: string) {
    try {
      await apiPatch(`/admin/tipsters/${tipsterId}/display-order`, { displayOrder: orderValues[tipsterId] ?? 0 });
      setOrderSaved(tipsterId);
      setTimeout(() => setOrderSaved(null), 2000);
      onUpdate();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Impossible d'enregistrer l'ordre",
        "error",
      );
    }
  }

  function subStatusTone(status: string): BadgeTone {
    if (status === "ACTIVE") return "success";
    if (status === "FREE") return "muted";
    return "danger";
  }

  return (
    <div className="space-y-8">
      {/* ── Display order ── */}
      <div>
        <h3 className="mb-3 font-body text-body-16 text-foreground">
          Ordre d&apos;affichage sur la homepage
        </h3>
        <div className={tableWrapperCls}>
          <table className={tableCls}>
            <thead>
              <tr className={theadRowCls}>
                <th className={thCls}>Expert</th>
                <th className={thCls}>Ordre</th>
                <th className={thCls}>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {tipsters.length === 0 ? (
                <EmptyRow cols={3} message="Aucun expert enregistré" />
              ) : (
                tipsters.map((t) => (
                  <tr key={t.id} className={tbodyRowCls}>
                    <td className={cn(tdCls, "font-medium")}>{t.pseudo}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={orderValues[t.id] ?? 0}
                        onChange={(e) =>
                          setOrderValues((prev) => ({
                            ...prev,
                            [t.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className={cn(fieldClsCompact, "w-24")}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="primary" size="sm" onClick={() => handleSaveOrder(t.id)}>
                          Enregistrer
                        </Button>
                        {orderSaved === t.id && (
                          <span className="font-body text-body-16 text-accent">Mis à jour</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tipsters list ── */}
      <div>
        <h3 className="mb-3 font-body text-body-16 text-foreground">
          Liste des experts
        </h3>

        {/* Desktop */}
        <div className={cn("hidden sm:block", tableWrapperCls, tableScrollCls)}>
          <table className={tableCls}>
            <thead>
              <tr className={theadRowCls}>
                <th className={thCls}>Pseudo</th>
                <th className={thCls}>Email</th>
                <th className={thNumericCls}>Analyses</th>
                <th className={thNumericCls}>Abonnés</th>
                <th className={thCls}>Statut</th>
                <th className={thCls}>Avertissement</th>
              </tr>
            </thead>
            <tbody>
              {tipsters.length === 0 ? (
                <EmptyRow cols={6} message="Aucun expert enregistré" />
              ) : (
                tipsters.map((t) => (
                  <tr key={t.id} className={tbodyRowCls}>
                    <td className={cn(tdCls, "font-medium")}>{t.pseudo}</td>
                    <td className={tdMutedCls}>{t.user.email}</td>
                    <td className={tdNumericCls}>{t._count.pronos}</td>
                    <td className={tdNumericCls}>{t._count.subscriptions}</td>
                    <td className="px-4 py-3">
                      <span className={cn(badgeBaseCls, BADGE_TONES[subStatusTone(t.subStatus)])}>
                        {t.subStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === t.id ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            value={warningText}
                            onChange={(e) => setWarningText(e.target.value)}
                            className={cn(fieldClsCompact, "min-w-[220px] resize-y")}
                            rows={2}
                            placeholder="Message d'avertissement…"
                          />
                          <div className="flex flex-col gap-2">
                            <Button type="button" variant="primary" size="sm" onClick={() => handleSaveWarning(t.id)}>
                              OK
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setWarningText("");
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {t.warningMessage && (
                            <span
                              className="max-w-[180px] truncate font-body text-body-16 text-destructive"
                              title={t.warningMessage}
                            >
                              {t.warningMessage}
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingId(t.id);
                              setWarningText(t.warningMessage || "");
                            }}
                          >
                            {t.warningMessage ? "Modifier" : "Avertir"}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 sm:hidden">
          {tipsters.length === 0 ? (
            <EmptyCard message="Aucun expert enregistré" />
          ) : (
            tipsters.map((t) => (
              <div key={t.id} className={mobileCardCls}>
                <div className="flex items-center justify-between">
                  <p className="font-body text-body-16 font-medium text-foreground">{t.pseudo}</p>
                  <span className={cn(badgeBaseCls, BADGE_TONES[subStatusTone(t.subStatus)])}>
                    {t.subStatus}
                  </span>
                </div>
                <p className="mt-1 font-body text-body-16 text-muted-foreground">{t.user.email}</p>
                <div className="mt-2 flex gap-4 font-body text-body-16 text-muted-foreground">
                  <span>{t._count.pronos} analyses</span>
                  <span>{t._count.subscriptions} abonnés</span>
                </div>
                {t.warningMessage && (
                  <p className="mt-2 font-body text-body-16 text-destructive">
                    {t.warningMessage}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingId(t.id);
                    setWarningText(t.warningMessage || "");
                  }}
                  className="mt-3"
                >
                  {t.warningMessage ? "Modifier l'avertissement" : "Avertir"}
                </Button>
                {editingId === t.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={warningText}
                      onChange={(e) => setWarningText(e.target.value)}
                      className={cn(fieldClsCompact, "resize-y")}
                      rows={3}
                      placeholder="Message d'avertissement…"
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="primary" size="sm" onClick={() => handleSaveWarning(t.id)}>
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setWarningText("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Pronos Section ══════════════════ */

function PronosSection({
  pronos,
  onOverride,
}: {
  pronos: AdminProno[];
  onOverride: (id: string, result: "WON" | "LOST") => void;
}) {
  return (
    <>
      {/* Desktop */}
      <div className={cn("hidden sm:block", tableWrapperCls, tableScrollCls)}>
        <table className={tableCls}>
          <thead>
            <tr className={theadRowCls}>
              <th className={thCls}>Match</th>
              <th className={thCls}>Expert</th>
              <th className={thNumericCls}>Cote</th>
              <th className={thCls}>Résultat</th>
              <th className={thCls}>Date</th>
              <th className={thCls}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pronos.length === 0 ? (
              <EmptyRow cols={6} message="Aucune analyse" />
            ) : (
              pronos.map((p) => (
                <tr key={p.id} className={tbodyRowCls}>
                  <td className="px-4 py-3">
                    <p className="font-body text-body-16 font-medium text-foreground">{p.matchName}</p>
                    {p.league && (
                      <p className="font-body text-body-16 text-muted-foreground">{p.league}</p>
                    )}
                  </td>
                  <td className={tdMutedCls}>{p.tipster.pseudo}</td>
                  <td className={cn(tdNumericCls, "font-medium")}>@{p.odds}</td>
                  <td className="px-4 py-3">
                    <ResultBadge result={p.result} />
                  </td>
                  <td className={tdMutedCls}>
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onOverride(p.id, "WON")}
                        disabled={p.result === "WON"}
                      >
                        Gagné
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onOverride(p.id, "LOST")}
                        disabled={p.result === "LOST"}
                      >
                        Perdu
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 sm:hidden">
        {pronos.length === 0 ? (
          <EmptyCard message="Aucune analyse" />
        ) : (
          pronos.map((p) => (
            <div key={p.id} className={mobileCardCls}>
              <div className="flex items-center justify-between">
                <p className="font-body text-body-16 font-medium text-foreground">{p.matchName}</p>
                <ResultBadge result={p.result} />
              </div>
              <div className="mt-1 flex items-center gap-3 font-body text-body-16 text-muted-foreground">
                <span>{p.tipster.pseudo}</span>
                <span>@{p.odds}</span>
                <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onOverride(p.id, "WON")}
                  disabled={p.result === "WON"}
                  className="flex-1"
                >
                  Gagné
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onOverride(p.id, "LOST")}
                  disabled={p.result === "LOST"}
                  className="flex-1"
                >
                  Perdu
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ══════════════════ Users Section ══════════════════ */

function UsersSection({ users }: { users: AdminUser[] }) {
  return (
    <>
      {/* Desktop */}
      <div className={cn("hidden sm:block", tableWrapperCls, tableScrollCls)}>
        <table className={tableCls}>
          <thead>
            <tr className={theadRowCls}>
              <th className={thCls}>Email</th>
              <th className={thCls}>Rôle</th>
              <th className={thNumericCls}>Abonnements</th>
              <th className={thCls}>Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <EmptyRow cols={4} message="Aucun utilisateur enregistré" />
            ) : (
              users.map((u) => (
                <tr key={u.id} className={tbodyRowCls}>
                  <td className={tdCls}>{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className={tdNumericCls}>{u._count.subscriptions}</td>
                  <td className={tdMutedCls}>
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 sm:hidden">
        {users.length === 0 ? (
          <EmptyCard message="Aucun utilisateur enregistré" />
        ) : (
          users.map((u) => (
            <div key={u.id} className={mobileCardCls}>
              <div className="flex items-center justify-between">
                <p className="font-body text-body-16 text-foreground">{u.email}</p>
                <RoleBadge role={u.role} />
              </div>
              <div className="mt-1 flex gap-3 font-body text-body-16 text-muted-foreground">
                <span>
                  {u._count.subscriptions} abonnement{u._count.subscriptions > 1 ? "s" : ""}
                </span>
                <span>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ══════════════════ Badges partagés ══════════════════ */

function ResultBadge({ result }: { result: string }) {
  const tone: BadgeTone =
    result === "WON" ? "success" : result === "LOST" ? "danger" : "muted";
  return (
    <span className={cn(badgeBaseCls, BADGE_TONES[tone])}>
      {result === "WON" ? "Gagné" : result === "LOST" ? "Perdu" : "En attente"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  // ADMIN = premium (doré), TIPSTER = success (vert), USER = muted.
  const tone: BadgeTone =
    role === "ADMIN" ? "premium" : role === "TIPSTER" ? "success" : "muted";
  return <span className={cn(badgeBaseCls, BADGE_TONES[tone])}>{role}</span>;
}
