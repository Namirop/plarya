"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type { RevenueDay } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

/**
 * Section "Revenus" du panel admin. Bouton d'export CSV + chart 30j.
 *
 * Les KPIs globaux (CA total, CA mois, ventes mois, abos actifs) sont
 * rendus par AdminClient (Bloc KPIs) à partir des mêmes data, pour
 * rester visibles quel que soit l'onglet actif.
 */
export function RevenueSection({ revenueDays }: { revenueDays: RevenueDay[] }) {
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
      showToast(err instanceof Error ? err.message : "Impossible d'exporter le CSV", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button type="button" variant="secondary" size="sm" onClick={handleExportCSV}>
          Exporter les ventes du mois (CSV)
        </Button>
      </div>

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
              <div
                key={day.date}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-colors group-hover:bg-foreground/50",
                    isToday ? "bg-foreground" : "bg-foreground/25",
                  )}
                  style={{
                    height: `${height}%`,
                    minHeight: day.revenue > 0 ? "2px" : "0",
                  }}
                />
                <div className="absolute bottom-full z-10 mb-1 hidden group-hover:block">
                  <div className="whitespace-nowrap rounded-lg border border-surface-elevated bg-black/90 px-2 py-1 font-body text-body-16 text-foreground shadow-md">
                    {dateObj.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" — "}
                    {formatPrice(day.revenue)}€ ({day.salesCount} vente
                    {day.salesCount > 1 ? "s" : ""})
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
