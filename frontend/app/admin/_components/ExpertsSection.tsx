"use client";

import { useEffect, useRef, useState } from "react";

import { DotsSixVertical } from "@phosphor-icons/react";
import { Reorder } from "motion/react";

import { EmptyRow, EmptyCard } from "@/components/admin/empty-states";
import { WarningModal } from "@/components/admin/warning-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
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

  // Cible de la modale d'avertissement (null = fermée).
  const [warningTarget, setWarningTarget] = useState<AdminExpert | null>(null);

  // Ordre d'affichage — état local pour le drag, synchronisé sur les
  // props (resync après refetch), persisté au drop.
  const [order, setOrder] = useState<AdminExpert[]>(experts);
  const orderRef = useRef(order);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setOrder(experts);
  }, [experts]);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  async function handleSaveWarning(message: string) {
    if (!warningTarget) return;
    try {
      await apiPatch(`/admin/experts/${warningTarget.id}/warning`, {
        warningMessage: message || null,
      });
      showToast(message ? "Avertissement enregistré" : "Avertissement retiré", "success");
      setWarningTarget(null);
      onUpdate();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Impossible d'enregistrer l'avertissement",
        "error",
      );
      throw err; // garde la modale ouverte
    }
  }

  // Persiste l'ordre courant au drop. Pas de endpoint bulk : on PATCH
  // chaque expert dont l'index a changé (displayOrder = index). Volume
  // faible (admin, usage rare) → coût acceptable.
  async function persistOrder() {
    if (savingOrder) return;
    const updates = orderRef.current
      .map((e, i) => ({ id: e.id, displayOrder: i, prev: e.displayOrder }))
      .filter((u) => u.prev !== u.displayOrder);
    if (updates.length === 0) return;

    setSavingOrder(true);
    try {
      await Promise.all(
        updates.map((u) =>
          apiPatch(`/admin/experts/${u.id}/display-order`, { displayOrder: u.displayOrder }),
        ),
      );
      showToast("Ordre mis à jour", "success");
      onUpdate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Impossible d'enregistrer l'ordre", "error");
      setOrder(experts); // rollback visuel
    } finally {
      setSavingOrder(false);
    }
  }

  function subStatusTone(status: string): BadgeTone {
    if (status === "ACTIVE") return "success";
    if (status === "FREE") return "muted";
    return "danger";
  }

  return (
    <div className="space-y-8">
      {/* ── Ordre d'affichage — drag & drop ── */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="font-body text-body-16 text-foreground">
            Ordre d&apos;affichage sur la homepage
          </h3>
          {savingOrder && (
            <span className="font-body text-sm text-muted-foreground">Enregistrement…</span>
          )}
        </div>
        <p className="mb-3 font-body text-sm text-muted-foreground">
          Glissez-déposez les experts pour définir leur ordre (le premier s&apos;affiche en haut de
          la page d&apos;accueil).
        </p>

        {order.length === 0 ? (
          <div className={mobileCardCls}>
            <p className="font-body text-body-16 text-muted-foreground">Aucun expert enregistré</p>
          </div>
        ) : (
          <Reorder.Group
            as="ul"
            axis="y"
            values={order}
            onReorder={setOrder}
            className="space-y-2"
          >
            {order.map((t, i) => (
              <Reorder.Item
                key={t.id}
                value={t}
                onDragEnd={persistOrder}
                whileDrag={{ scale: 1.02, boxShadow: "0 14px 32px rgba(0,0,0,0.6)" }}
                className={cn(
                  "flex touch-none select-none items-center gap-3 rounded-2xl border border-surface-elevated bg-surface-2 px-4 py-3",
                  "cursor-grab active:cursor-grabbing",
                )}
              >
                <DotsSixVertical className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="w-6 shrink-0 font-body text-body-16 tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-body text-body-16 font-medium text-foreground">
                  {t.pseudo}
                </span>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* ── Liste des experts ── */}
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
                          onClick={() => setWarningTarget(t)}
                        >
                          {t.warningMessage ? "Modifier" : "Avertir"}
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
                  onClick={() => setWarningTarget(t)}
                  className="mt-3"
                >
                  {t.warningMessage ? "Modifier l'avertissement" : "Avertir"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modale d'avertissement ── */}
      <WarningModal
        open={!!warningTarget}
        expertPseudo={warningTarget?.pseudo ?? ""}
        initialValue={warningTarget?.warningMessage ?? ""}
        onClose={() => setWarningTarget(null)}
        onSave={handleSaveWarning}
      />
    </div>
  );
}
