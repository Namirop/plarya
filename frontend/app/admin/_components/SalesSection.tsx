"use client";

import { EmptyRow, EmptyCard } from "@/components/admin/empty-states";
import {
  tableWrapperCls,
  tableScrollCls,
  tableCls,
  theadRowCls,
  thCls,
  thNumericCls,
  tbodyRowCls,
  tdCls,
  tdMutedCls,
  tdNumericCls,
  badgeBaseCls,
  BADGE_TONES,
  mobileCardCls,
} from "@/lib/admin-styles";
import { formatPrice } from "@/lib/constants";
import type { Sale } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function SalesSection({ sales, total }: { sales: Sale[]; total: number }) {
  return (
    <div className="space-y-4">
      <p className="font-body text-body-16 text-muted-foreground">
        {total} vente{total > 1 ? "s" : ""} au total
      </p>

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
                    {new Date(s.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className={tdCls}>{s.email}</td>
                  <td className={cn(tdCls, "font-medium")}>{s.expertPseudo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        badgeBaseCls,
                        s.type === "MONTHLY" ? BADGE_TONES.premium : BADGE_TONES.muted,
                      )}
                    >
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

      <div className="space-y-3 sm:hidden">
        {sales.length === 0 ? (
          <EmptyCard message="Aucune vente enregistrée" />
        ) : (
          sales.map((s) => (
            <div key={s.id} className={mobileCardCls}>
              <div className="flex items-center justify-between">
                <p className="font-body text-body-16 font-medium text-foreground">
                  {s.expertPseudo}
                </p>
                <span className="font-body text-body-16 font-medium text-foreground">
                  {formatPrice(s.amount)}€
                </span>
              </div>
              <p className="mt-1 font-body text-body-16 text-muted-foreground">{s.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-body text-body-16 text-muted-foreground">
                  {new Date(s.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span
                  className={cn(
                    badgeBaseCls,
                    s.type === "MONTHLY" ? BADGE_TONES.premium : BADGE_TONES.muted,
                  )}
                >
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
