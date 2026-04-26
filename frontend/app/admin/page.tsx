"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { apiGet, apiPost, apiPatch, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/constants";

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

/* ── Page ── */

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useUser();
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
        <div className="size-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-[#00D47E]" />
      </div>
    );
  }

  async function handleSendEmails() {
    setEmailStatus("Envoi...");
    try { await apiPost<{ message: string }>("/admin/send-daily-emails", {}); setEmailStatus("Emails J+1 envoyés !"); }
    catch { setEmailStatus("Erreur lors de l'envoi"); }
    setTimeout(() => setEmailStatus(""), 3000);
  }

  async function handleOverrideResult(pronoId: string, result: "WON" | "LOST") {
    try {
      await apiPatch(`/admin/pronos/${pronoId}/result`, { result });
      setPronos((prev) => prev.map((p) => (p.id === pronoId ? { ...p, result } : p)));
    } catch { /* silent */ }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[family-name:var(--font-dm-serif)] text-3xl italic text-[#F0EDE8]">Panel Admin</h1>
        <button type="button" onClick={handleSendEmails}
          className="h-9 rounded-md bg-[#F0EDE8] px-4 text-sm font-semibold text-[#080808] transition-all hover:bg-[#00D47E]">
          {emailStatus || "Envoyer emails J+1"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[#1A1A1A]">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? "border-b-2 border-[#00D47E] text-[#00D47E]" : "text-[#8A8680] hover:text-[#F0EDE8]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "revenus" && stats && <RevenueSection stats={stats} revenueDays={revenueDays} />}
        {tab === "ventes" && <SalesSection sales={sales} total={salesTotal} tipsters={tipsters} />}
        {tab === "par-expert" && <ByTipsterSection tipsterRevenue={tipsterRevenue} />}
        {tab === "tipsters" && <TipstersSection tipsters={tipsters} onUpdate={fetchAll} />}
        {tab === "pronos" && <PronosSection pronos={pronos} onOverride={handleOverrideResult} />}
        {tab === "users" && <UsersSection users={users} />}
      </div>
    </div>
  );
}

/* ── Revenue Section ── */

function RevenueSection({ stats, revenueDays }: { stats: Stats; revenueDays: RevenueDay[] }) {
  const now = new Date();
  const currentMonthDays = revenueDays.filter((d) => {
    const date = new Date(d.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthRevenue = currentMonthDays.reduce((s, d) => s + d.revenue, 0);
  const monthSales = currentMonthDays.reduce((s, d) => s + d.salesCount, 0);
  const totalRevenue = revenueDays.reduce((s, d) => s + d.revenue, 0);
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
    } catch { /* silent */ }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="CA total (30j)" value={`${formatPrice(totalRevenue)}\u20AC`} />
        <StatCard label="CA ce mois" value={`${formatPrice(monthRevenue)}\u20AC`} />
        <StatCard label="Ventes ce mois" value={String(monthSales)} />
        <StatCard label="Abonnements actifs" value={String(stats.activeSubscriptionsCount)} />
      </div>

      <div>
        <button type="button" onClick={handleExportCSV}
          className="h-9 rounded-md ring-1 ring-[#1A1A1A] px-4 text-sm font-medium text-[#8A8680] hover:text-[#F0EDE8] hover:ring-[#8A8680]/30 transition-all">
          Exporter les ventes du mois (CSV)
        </button>
      </div>

      {/* Revenue chart */}
      <div>
        <h3 className="text-sm font-semibold text-[#F0EDE8] mb-3">CA par jour (30 derniers jours)</h3>
        <div className="flex items-end gap-[2px] h-40 rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-3">
          {revenueDays.map((day) => {
            const height = day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 100, 4) : 0;
            const dateObj = new Date(day.date);
            const isToday = dateObj.toDateString() === now.toDateString();
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className={`w-full rounded-t-sm transition-colors ${isToday ? "bg-[#00D47E]" : "bg-[#F0EDE8]/25"} group-hover:bg-[#F0EDE8]/50`}
                  style={{ height: `${height}%`, minHeight: day.revenue > 0 ? "2px" : "0" }}
                />
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                  <div className="rounded bg-[#141414] px-2 py-1 text-[10px] text-[#F0EDE8] whitespace-nowrap shadow-md ring-1 ring-[#1A1A1A]">
                    {dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {" — "}{formatPrice(day.revenue)}&euro; ({day.salesCount} vente{day.salesCount > 1 ? "s" : ""})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-[#8A8680]/60 px-3">
          <span>{revenueDays[0]?.date.slice(5)}</span>
          <span>{revenueDays[revenueDays.length - 1]?.date.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Sales Section ── */

function SalesSection({ sales, total }: { sales: Sale[]; total: number; tipsters: AdminTipster[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8A8680]">{total} vente{total > 1 ? "s" : ""} au total</p>

      <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-[#1A1A1A]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Email</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Expert</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Montant</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-[#1A1A1A] last:border-b-0">
                <td className="px-4 py-3 text-sm text-[#8A8680]">
                  {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-sm text-[#F0EDE8]">{s.email}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#F0EDE8]">{s.tipsterPseudo}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    s.type === "MONTHLY" ? "bg-[#00D47E]/15 text-[#00D47E]" : "bg-[#141414] text-[#8A8680]"
                  }`}>{s.type === "DAY_PASS" ? "Day Pass" : "Mensuel"}</span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[#F0EDE8]">{formatPrice(s.amount)}&euro;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {sales.map((s) => (
          <div key={s.id} className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#F0EDE8]">{s.tipsterPseudo}</p>
              <span className="text-sm font-bold text-[#F0EDE8]">{formatPrice(s.amount)}&euro;</span>
            </div>
            <p className="mt-1 text-xs text-[#8A8680]">{s.email}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#8A8680]">
              <span>{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                s.type === "MONTHLY" ? "bg-[#00D47E]/15 text-[#00D47E]" : "bg-[#141414] text-[#8A8680]"
              }`}>{s.type === "DAY_PASS" ? "Day Pass" : "Mensuel"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── By Tipster Section ── */

function ByTipsterSection({ tipsterRevenue }: { tipsterRevenue: TipsterRevenue[] }) {
  return (
    <div>
      <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-[#1A1A1A]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Expert</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Ventes</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">CA total</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Part expert (70%)</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Part plateforme (30%)</th>
            </tr>
          </thead>
          <tbody>
            {tipsterRevenue.map((t) => (
              <tr key={t.tipsterId} className="border-b border-[#1A1A1A] last:border-b-0">
                <td className="px-4 py-3 text-sm font-medium text-[#F0EDE8]">{t.pseudo}</td>
                <td className="px-4 py-3 text-sm text-[#F0EDE8]">{t.salesCount}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#F0EDE8]">{formatPrice(t.totalRevenue)}&euro;</td>
                <td className="px-4 py-3 text-sm text-[#00D47E] font-medium">{formatPrice(t.tipsterShare)}&euro;</td>
                <td className="px-4 py-3 text-sm text-[#8A8680]">{formatPrice(t.totalRevenue - t.tipsterShare)}&euro;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {tipsterRevenue.map((t) => (
          <div key={t.tipsterId} className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#F0EDE8]">{t.pseudo}</p>
              <span className="text-sm font-bold text-[#F0EDE8]">{formatPrice(t.totalRevenue)}&euro;</span>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-[#8A8680]">
              <span>{t.salesCount} vente{t.salesCount > 1 ? "s" : ""}</span>
              <span className="text-[#00D47E] font-medium">Expert: {formatPrice(t.tipsterShare)}&euro;</span>
              <span>Plateforme: {formatPrice(t.totalRevenue - t.tipsterShare)}&euro;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tipsters Section ── */

function TipstersSection({ tipsters, onUpdate }: { tipsters: AdminTipster[]; onUpdate: () => void }) {
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
    try { await apiPatch(`/admin/tipsters/${tipsterId}/warning`, { warningMessage: warningText || null }); setEditingId(null); setWarningText(""); onUpdate(); } catch { /* silent */ }
  }

  async function handleSaveOrder(tipsterId: string) {
    try { await apiPatch(`/admin/tipsters/${tipsterId}/display-order`, { displayOrder: orderValues[tipsterId] ?? 0 }); setOrderSaved(tipsterId); setTimeout(() => setOrderSaved(null), 2000); onUpdate(); } catch { /* silent */ }
  }

  return (
    <div className="space-y-8">
      {/* Display order */}
      <div>
        <h3 className="text-sm font-semibold text-[#F0EDE8] mb-3">Ordre d&apos;affichage sur la homepage</h3>
        <div className="rounded-lg ring-1 ring-[#1A1A1A] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
                <th className="px-4 py-2 text-xs font-medium text-[#8A8680]">Expert</th>
                <th className="px-4 py-2 text-xs font-medium text-[#8A8680]">Ordre</th>
                <th className="px-4 py-2 text-xs font-medium text-[#8A8680]"></th>
              </tr>
            </thead>
            <tbody>
              {tipsters.map((t) => (
                <tr key={t.id} className="border-b border-[#1A1A1A] last:border-b-0">
                  <td className="px-4 py-2 text-sm font-medium text-[#F0EDE8]">{t.pseudo}</td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} value={orderValues[t.id] ?? 0}
                      onChange={(e) => setOrderValues((prev) => ({ ...prev, [t.id]: parseInt(e.target.value) || 0 }))}
                      className="w-20 rounded bg-[#080808] ring-1 ring-[#1A1A1A] px-2 py-1 text-sm text-[#F0EDE8] focus:ring-[#00D47E]/50" />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleSaveOrder(t.id)}
                        className="h-7 rounded-md bg-[#F0EDE8] px-3 text-[11px] font-semibold text-[#080808] hover:bg-[#00D47E] transition-all">
                        Enregistrer
                      </button>
                      {orderSaved === t.id && <span className="text-xs text-[#00D47E]">Mis à jour</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tipsters list */}
      <div>
        <h3 className="text-sm font-semibold text-[#F0EDE8] mb-3">Liste des experts</h3>
        <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-[#1A1A1A]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
                <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Pseudo</th>
                <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Analyses</th>
                <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Abonnés</th>
                <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Statut</th>
                <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Avertissement</th>
              </tr>
            </thead>
            <tbody>
              {tipsters.map((t) => (
                <tr key={t.id} className="border-b border-[#1A1A1A] last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium text-[#F0EDE8]">{t.pseudo}</td>
                  <td className="px-4 py-3 text-sm text-[#8A8680]">{t.user.email}</td>
                  <td className="px-4 py-3 text-sm text-[#F0EDE8]">{t._count.pronos}</td>
                  <td className="px-4 py-3 text-sm text-[#F0EDE8]">{t._count.subscriptions}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      t.subStatus === "ACTIVE" ? "bg-emerald-400/15 text-emerald-400"
                      : t.subStatus === "FREE" ? "bg-[#141414] text-[#8A8680]"
                      : "bg-red-400/15 text-red-400"
                    }`}>{t.subStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <div className="flex items-center gap-2">
                        <Textarea value={warningText} onChange={(e) => setWarningText(e.target.value)}
                          className="h-16 min-w-[200px] text-xs bg-[#080808] border-[#1A1A1A] text-[#F0EDE8] placeholder:text-[#8A8680]/40"
                          placeholder="Message d'avertissement..." />
                        <div className="flex flex-col gap-1">
                          <button type="button" onClick={() => handleSaveWarning(t.id)}
                            className="h-7 rounded-md bg-[#F0EDE8] px-2 text-[11px] font-semibold text-[#080808] hover:bg-[#00D47E] transition-all">OK</button>
                          <Button variant="outline" onClick={() => { setEditingId(null); setWarningText(""); }}
                            className="h-7 px-2 text-[11px] border-[#1A1A1A] text-[#8A8680] hover:text-[#F0EDE8]">Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {t.warningMessage && <span className="text-xs text-red-400 max-w-[150px] truncate" title={t.warningMessage}>{t.warningMessage}</span>}
                        <Button variant="outline" onClick={() => { setEditingId(t.id); setWarningText(t.warningMessage || ""); }}
                          className="h-7 px-2 text-[11px] border-[#1A1A1A] text-[#8A8680] hover:text-[#F0EDE8]">
                          {t.warningMessage ? "Modifier" : "Avertir"}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 sm:hidden">
          {tipsters.map((t) => (
            <div key={t.id} className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#F0EDE8]">{t.pseudo}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  t.subStatus === "ACTIVE" ? "bg-emerald-400/15 text-emerald-400" : "bg-[#141414] text-[#8A8680]"
                }`}>{t.subStatus}</span>
              </div>
              <p className="mt-1 text-xs text-[#8A8680]">{t.user.email}</p>
              <div className="mt-2 flex gap-4 text-xs text-[#8A8680]">
                <span>{t._count.pronos} analyses</span>
                <span>{t._count.subscriptions} abonnés</span>
              </div>
              {t.warningMessage && <p className="mt-2 text-xs text-red-400">{t.warningMessage}</p>}
              <Button variant="outline" onClick={() => { setEditingId(t.id); setWarningText(t.warningMessage || ""); }}
                className="mt-2 h-7 px-2 text-[11px] border-[#1A1A1A] text-[#8A8680] hover:text-[#F0EDE8]">
                {t.warningMessage ? "Modifier avertissement" : "Avertir"}
              </Button>
              {editingId === t.id && (
                <div className="mt-2 space-y-2">
                  <Textarea value={warningText} onChange={(e) => setWarningText(e.target.value)}
                    className="h-16 text-xs bg-[#080808] border-[#1A1A1A] text-[#F0EDE8] placeholder:text-[#8A8680]/40" placeholder="Message d'avertissement..." />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleSaveWarning(t.id)}
                      className="h-7 rounded-md bg-[#F0EDE8] px-3 text-[11px] font-semibold text-[#080808] hover:bg-[#00D47E] transition-all">Enregistrer</button>
                    <Button variant="outline" onClick={() => { setEditingId(null); setWarningText(""); }}
                      className="h-7 px-3 text-[11px] border-[#1A1A1A] text-[#8A8680] hover:text-[#F0EDE8]">Annuler</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Pronos Section ── */

function PronosSection({ pronos, onOverride }: { pronos: AdminProno[]; onOverride: (id: string, result: "WON" | "LOST") => void }) {
  return (
    <>
      <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-[#1A1A1A]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Match</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Expert</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Cote</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Résultat</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pronos.map((p) => (
              <tr key={p.id} className="border-b border-[#1A1A1A] last:border-b-0">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#F0EDE8]">{p.matchName}</p>
                  {p.league && <p className="text-[11px] text-[#8A8680]">{p.league}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-[#8A8680]">{p.tipster.pseudo}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#F0EDE8]">@{p.odds}</td>
                <td className="px-4 py-3"><ResultBadge result={p.result} /></td>
                <td className="px-4 py-3 text-xs text-[#8A8680]">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onOverride(p.id, "WON")} disabled={p.result === "WON"}
                      className="h-7 rounded ring-1 ring-emerald-400/30 px-2 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-400/10 transition-all disabled:opacity-30">Gagné</button>
                    <button type="button" onClick={() => onOverride(p.id, "LOST")} disabled={p.result === "LOST"}
                      className="h-7 rounded ring-1 ring-[#1A1A1A] px-2 text-[11px] font-medium text-[#8A8680] hover:text-[#F0EDE8] transition-all disabled:opacity-30">Perdu</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {pronos.map((p) => (
          <div key={p.id} className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#F0EDE8]">{p.matchName}</p>
              <ResultBadge result={p.result} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#8A8680]">
              <span>{p.tipster.pseudo}</span><span>@{p.odds}</span>
              <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => onOverride(p.id, "WON")} disabled={p.result === "WON"}
                className="h-7 flex-1 rounded ring-1 ring-emerald-400/30 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-400/10 transition-all disabled:opacity-30">Gagné</button>
              <button type="button" onClick={() => onOverride(p.id, "LOST")} disabled={p.result === "LOST"}
                className="h-7 flex-1 rounded ring-1 ring-[#1A1A1A] text-[11px] font-medium text-[#8A8680] hover:text-[#F0EDE8] transition-all disabled:opacity-30">Perdu</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Users Section ── */

function UsersSection({ users }: { users: AdminUser[] }) {
  return (
    <>
      <div className="hidden sm:block overflow-x-auto rounded-lg ring-1 ring-[#1A1A1A]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Email</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Rôle</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Abonnements</th>
              <th className="px-4 py-3 text-xs font-medium text-[#8A8680]">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#1A1A1A] last:border-b-0">
                <td className="px-4 py-3 text-sm text-[#F0EDE8]">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3 text-sm text-[#F0EDE8]">{u._count.subscriptions}</td>
                <td className="px-4 py-3 text-xs text-[#8A8680]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#F0EDE8]">{u.email}</p>
              <RoleBadge role={u.role} />
            </div>
            <div className="mt-1 flex gap-3 text-xs text-[#8A8680]">
              <span>{u._count.subscriptions} abonnement{u._count.subscriptions > 1 ? "s" : ""}</span>
              <span>{new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Shared ── */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0E0E0E] ring-1 ring-[#1A1A1A] p-4 text-center">
      <p className="text-2xl font-bold text-[#F0EDE8]">{value}</p>
      <p className="mt-1 text-xs text-[#8A8680]">{label}</p>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const styles = result === "WON" ? "bg-emerald-400/15 text-emerald-400"
    : result === "LOST" ? "bg-red-400/15 text-red-400"
    : "bg-[#141414] text-[#8A8680]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {result === "WON" ? "Gagné" : result === "LOST" ? "Perdu" : "En attente"}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles = role === "ADMIN" ? "bg-[#00D47E]/15 text-[#00D47E]"
    : role === "TIPSTER" ? "bg-emerald-400/15 text-emerald-400"
    : "bg-[#141414] text-[#8A8680]";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {role}
    </span>
  );
}
