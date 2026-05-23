"use client";

import { RoleBadge } from "@/components/admin/badges";
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
import type { AdminUser } from "@/lib/types/admin";
import { cn } from "@/lib/utils";

export function UsersSection({ users }: { users: AdminUser[] }) {
  return (
    <>
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
                  {u._count.subscriptions} abonnement
                  {u._count.subscriptions > 1 ? "s" : ""}
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
