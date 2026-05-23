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
  mobileCardCls,
} from "@/lib/admin-styles";
import { formatPrice } from "@/lib/constants";
import type { ExpertRevenue } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function ByExpertSection({ expertRevenue }: { expertRevenue: ExpertRevenue[] }) {
  return (
    <div>
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
            {expertRevenue.length === 0 ? (
              <EmptyRow cols={5} message="Aucune donnée pour les experts" />
            ) : (
              expertRevenue.map((t) => (
                <tr key={t.expertId} className={tbodyRowCls}>
                  <td className={cn(tdCls, "font-medium")}>{t.pseudo}</td>
                  <td className={tdNumericCls}>{t.salesCount}</td>
                  <td className={cn(tdNumericCls, "font-medium")}>
                    {formatPrice(t.totalRevenue)}€
                  </td>
                  <td className={cn(tdNumericCls, "font-medium text-accent")}>
                    {formatPrice(t.expertShare)}€
                  </td>
                  <td className={tdMutedCls + " text-right"}>
                    {formatPrice(t.totalRevenue - t.expertShare)}€
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {expertRevenue.length === 0 ? (
          <EmptyCard message="Aucune donnée pour les experts" />
        ) : (
          expertRevenue.map((t) => (
            <div key={t.expertId} className={mobileCardCls}>
              <div className="flex items-center justify-between">
                <p className="font-body text-body-16 font-medium text-foreground">{t.pseudo}</p>
                <span className="font-body text-body-16 font-medium text-foreground">
                  {formatPrice(t.totalRevenue)}€
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-body-16 text-muted-foreground">
                <span>
                  {t.salesCount} vente{t.salesCount > 1 ? "s" : ""}
                </span>
                <span className="font-medium text-accent">
                  Expert : {formatPrice(t.expertShare)}€
                </span>
                <span>Plateforme : {formatPrice(t.totalRevenue - t.expertShare)}€</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
