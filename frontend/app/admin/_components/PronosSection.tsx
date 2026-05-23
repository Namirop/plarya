"use client";

import { ResultBadge } from "@/components/admin/badges";
import { EmptyRow, EmptyCard } from "@/components/admin/empty-states";
import { Button } from "@/components/ui/button";
import {
  tableWrapperCls,
  tableScrollCls,
  tableCls,
  theadRowCls,
  thCls,
  thNumericCls,
  tbodyRowCls,
  tdMutedCls,
  tdNumericCls,
  mobileCardCls,
} from "@/lib/admin-styles";
import type { AdminProno } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function PronosSection({
  pronos,
  onOverride,
  offset,
  total,
  pageSize,
  onPageChange,
}: {
  pronos: AdminProno[];
  onOverride: (id: string, result: "WON" | "LOST") => void;
  offset: number;
  total: number;
  pageSize: number;
  onPageChange: (offset: number) => void;
}) {
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = offset > 0;
  const hasNext = offset + pronos.length < total;

  return (
    <>
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
                    <p className="font-body text-body-16 font-medium text-foreground">
                      {p.matchName}
                    </p>
                    {p.league && (
                      <p className="font-body text-body-16 text-muted-foreground">{p.league}</p>
                    )}
                  </td>
                  <td className={tdMutedCls}>{p.expert.pseudo}</td>
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
                <span>{p.expert.pseudo}</span>
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

      {/* Pagination — affichée seulement si plus d'une page */}
      {total > pageSize && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="font-body text-body-16 text-muted-foreground">
            Page <span className="text-foreground">{currentPage}</span> / {totalPages}
            <span className="ml-2 text-muted-foreground/70">({total} analyses au total)</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.max(0, offset - pageSize))}
              disabled={!hasPrev}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(offset + pageSize)}
              disabled={!hasNext}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
