"use client";

import { useMemo, useState } from "react";

import { EmptyRow, EmptyCard } from "@/components/admin/empty-states";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import {
  fieldClsCompact,
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
  type BadgeTone,
  mobileCardCls,
} from "@/lib/admin-styles";
import { apiPatch } from "@/lib/api";
import type { AdminExpert } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function ExpertsSection({
  experts,
  onUpdate,
}: {
  experts: AdminExpert[];
  /** Callback déclenché après une mutation (warning ou displayOrder) :
   *  AdminClient le branche sur un refetch complet pour resync les
   *  stats by-expert (le pseudo peut être référencé ailleurs). */
  onUpdate: () => void;
}) {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [warningText, setWarningText] = useState("");
  // Local edits seulement — source de vérité pour la valeur affichée
  // reste experts[i].displayOrder (props). Évite que fetchAll() reset
  // implicitement les modifs non-sauvées.
  const [orderEdits, setOrderEdits] = useState<Record<string, number>>({});
  const [orderSaved, setOrderSaved] = useState<string | null>(null);

  const orderValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const t of experts) {
      values[t.id] = orderEdits[t.id] ?? t.displayOrder;
    }
    return values;
  }, [experts, orderEdits]);

  async function handleSaveWarning(expertId: string) {
    try {
      await apiPatch(`/admin/experts/${expertId}/warning`, {
        warningMessage: warningText || null,
      });
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

  async function handleSaveOrder(expertId: string) {
    try {
      await apiPatch(`/admin/experts/${expertId}/display-order`, {
        displayOrder: orderValues[expertId] ?? 0,
      });
      setOrderSaved(expertId);
      setTimeout(() => setOrderSaved(null), 2000);
      onUpdate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Impossible d'enregistrer l'ordre", "error");
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
              {experts.length === 0 ? (
                <EmptyRow cols={3} message="Aucun expert enregistré" />
              ) : (
                experts.map((t) => (
                  <tr key={t.id} className={tbodyRowCls}>
                    <td className={cn(tdCls, "font-medium")}>{t.pseudo}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={orderValues[t.id] ?? 0}
                        onChange={(e) =>
                          setOrderEdits((prev) => ({
                            ...prev,
                            [t.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        aria-label={`Position d'affichage de ${t.pseudo} sur la homepage`}
                        className={cn(fieldClsCompact, "w-24")}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveOrder(t.id)}
                        >
                          Enregistrer
                        </Button>
                        {orderSaved === t.id && (
                          <span className="font-body text-body-16 text-foreground">
                            Mis à jour
                          </span>
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

      {/* ── Experts list ── */}
      <div>
        <h3 className="mb-3 font-body text-body-16 text-foreground">Liste des experts</h3>

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
              {experts.length === 0 ? (
                <EmptyRow cols={6} message="Aucun expert enregistré" />
              ) : (
                experts.map((t) => (
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
                            aria-label={`Message d'avertissement pour ${t.pseudo}`}
                            className={cn(fieldClsCompact, "min-w-[220px] resize-y")}
                            rows={2}
                            placeholder="Message d'avertissement…"
                          />
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleSaveWarning(t.id)}
                            >
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

        <div className="space-y-3 sm:hidden">
          {experts.length === 0 ? (
            <EmptyCard message="Aucun expert enregistré" />
          ) : (
            experts.map((t) => (
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
                  <p className="mt-2 font-body text-body-16 text-destructive">{t.warningMessage}</p>
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
                      aria-label={`Message d'avertissement pour ${t.pseudo}`}
                      className={cn(fieldClsCompact, "resize-y")}
                      rows={3}
                      placeholder="Message d'avertissement…"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveWarning(t.id)}
                      >
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
