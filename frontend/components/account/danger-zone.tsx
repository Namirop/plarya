"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/hooks/use-user";
import { apiFetch, apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DeleteAccountModal } from "@/components/account/delete-account-modal";

interface DeletionStatus {
  canDelete: boolean;
  reason?: "active_subscriptions";
  activeSubscriptions?: number;
}

/**
 * Section "Zone dangereuse" en bas de /compte : export RGPD + suppression
 * compte. Composant indépendant pour pouvoir l'insérer dans la ExpertView
 * comme dans la UserView de /compte sans dupliquer la logique.
 */
export function DangerZone() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(
    null,
  );
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Charge le statut de suppression au mount (pour savoir si l'expert
  // a des subs actives → bloquer le bouton + afficher la raison).
  useEffect(() => {
    if (!user) return;
    apiGet<DeletionStatus>("/auth/me/deletion-status")
      .then(setDeletionStatus)
      .catch(() => setDeletionStatus({ canDelete: true }));
  }, [user]);

  async function handleExport() {
    if (exportLoading) return;
    setExportLoading(true);
    setExportMsg(null);
    try {
      const res = await apiFetch("/auth/me/export");
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      // Récupère le filename depuis Content-Disposition (fallback
      // safe si le header n'est pas exposé en CORS — Resend, etc.).
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "plarya-export.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg({ text: "Export téléchargé ✓", isError: false });
      setTimeout(() => setExportMsg(null), 5000);
    } catch (err) {
      setExportMsg({
        text: err instanceof Error ? err.message : "Erreur",
        isError: true,
      });
    } finally {
      setExportLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!user) return;
    await apiFetch("/auth/me", { method: "DELETE" }).then((res) => {
      if (!res.ok) {
        return res.json().then((body) => {
          throw new Error(body.error || `Erreur ${res.status}`);
        });
      }
    });
    // Côté backend la session a été wipée + le cookie cleared. On
    // appelle quand même logout() pour purger le state useUser
    // côté client (idempotent — POST /auth/logout sera 200 même
    // sans cookie).
    await logout();
    router.push("/");
  }

  if (!user) return null;

  const cannotDelete =
    deletionStatus?.canDelete === false &&
    deletionStatus.reason === "active_subscriptions";

  return (
    <>
      <section className="mt-16 rounded-2xl border border-destructive/40 bg-black/40 p-6 md:p-8">
        <h2 className="font-display text-h3 text-destructive">
          Zone dangereuse
        </h2>

        {/* ─── Export RGPD ─── */}
        <div className="mt-6">
          <h3 className="font-body text-h5 text-foreground">
            Exporter mes données
          </h3>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Télécharge un fichier JSON contenant l&apos;ensemble de tes données
            personnelles (profil, abonnements, historique).
          </p>
          <div className="mt-4 flex flex-col items-start gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? "Génération…" : "Exporter mes données"}
            </Button>
            {exportMsg && (
              <p
                role="status"
                className={
                  exportMsg.isError
                    ? "font-body text-body-16 text-destructive"
                    : "font-body text-body-16 text-accent"
                }
              >
                {exportMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* ─── Divider ─── */}
        <div className="my-8 h-px w-full bg-destructive/20" />

        {/* ─── Suppression compte ─── */}
        <div>
          <h3 className="font-body text-h5 text-foreground">
            Supprimer mon compte
          </h3>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Cette action est <strong className="text-foreground">irréversible</strong>.
            Ton profil sera anonymisé. Les données de facturation seront
            conservées conformément aux obligations légales.
          </p>
          {cannotDelete && (
            <p className="mt-3 font-body text-body-16 text-destructive">
              Tu ne peux pas supprimer ton compte tant que tu as des
              abonnés actifs ({deletionStatus.activeSubscriptions}). Attends
              que leurs abonnements expirent.
            </p>
          )}
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={cannotDelete}
              className="!border-destructive/60 !text-destructive hover:!bg-destructive/10"
            >
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </section>

      <DeleteAccountModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        userEmail={user.email}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
