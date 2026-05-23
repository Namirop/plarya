"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { DeleteAccountModal } from "@/components/account/delete-account-modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { apiFetch, apiGet, apiPost } from "@/lib/api";

interface DeletionStatus {
  canDelete: boolean;
  reason?: "active_subscriptions" | "scheduled";
  activeSubscriptions?: number;
  /** ISO date — set quand reason = scheduled */
  pendingDeletionAt?: string | null;
  /** ISO date — set quand l'expert a au moins une sub active */
  lastSubExpiresAt?: string | null;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Section "Zone dangereuse" en bas de /compte : export RGPD + suppression
 * compte. Composant indépendant pour pouvoir l'insérer dans la ExpertView
 * comme dans la UserView de /compte sans dupliquer la logique.
 *
 * Trois états de suppression :
 *  - canDelete: true → bouton "Supprimer mon compte" → soft delete immédiat.
 *  - reason: "active_subscriptions" → bouton "Programmer la suppression",
 *    modal explicite, DELETE renvoie 202 et flag pendingDeletionAt.
 *  - reason: "scheduled" → banner + bouton "Annuler la suppression"
 *    (POST /auth/me/cancel-deletion).
 */
export function DangerZone() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const refreshDeletionStatus = () => {
    apiGet<DeletionStatus>("/auth/me/deletion-status")
      .then(setDeletionStatus)
      .catch(() => setDeletionStatus({ canDelete: true }));
  };

  useEffect(() => {
    if (!user) return;
    refreshDeletionStatus();
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
    const res = await apiFetch("/auth/me", { method: "DELETE" });
    if (!res.ok) {
      // Defensive parse : si le backend renvoie une page HTML
      // (route absente — typiquement backend pas redémarré après un
      // ajout d'endpoint), res.json() crashe avec "Unexpected token
      // '<'". On lit en text d'abord puis on tente le JSON.
      const text = await res.text();
      let message = `Erreur ${res.status}`;
      try {
        const body = JSON.parse(text) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // Pas du JSON — on garde le code HTTP, sans le HTML.
      }
      throw new Error(message);
    }

    // 202 = suppression programmée (pendingDeletionAt). On reste loggé,
    // on ferme la modal et on rafraîchit le statut pour faire apparaître
    // le banner "Suppression programmée".
    if (res.status === 202) {
      setConfirmOpen(false);
      refreshDeletionStatus();
      return;
    }

    // 200 = soft delete immédiat. Backend a wipé sessions + cleared
    // cookie. logout() côté client purge le state useUser (idempotent).
    await logout();
    router.push("/");
  }

  async function handleCancelDeletion() {
    if (cancelLoading) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await apiPost("/auth/me/cancel-deletion", {});
      refreshDeletionStatus();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCancelLoading(false);
    }
  }

  if (!user) return null;

  const isScheduled = deletionStatus?.reason === "scheduled";
  const hasActiveSubs = deletionStatus?.reason === "active_subscriptions";

  return (
    <>
      <section className="mt-16 rounded-2xl border border-destructive/40 bg-black/40 p-6 md:p-8">
        <h2 className="font-display text-h3 text-destructive">Zone dangereuse</h2>

        {/* ─── Export RGPD ─── */}
        <div className="mt-6">
          <h3 className="font-body text-h5 text-foreground">Exporter mes données</h3>
          <p className="mt-2 font-body text-body-16 text-muted-foreground">
            Télécharge un fichier JSON contenant l&apos;ensemble de tes données personnelles
            (profil, abonnements, historique).
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
          <h3 className="font-body text-h5 text-foreground">Supprimer mon compte</h3>

          {isScheduled ? (
            <>
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="font-body text-body-16 text-foreground">
                  Suppression programmée le{" "}
                  <strong>{formatDate(deletionStatus?.pendingDeletionAt)}</strong>.
                </p>
                <p className="mt-1 font-body text-body-16 text-muted-foreground">
                  Ton profil n&apos;apparaît plus dans les listings publics et n&apos;accepte plus
                  de nouveaux abonnés. La suppression deviendra effective le{" "}
                  <strong className="text-foreground">
                    {formatDate(deletionStatus?.lastSubExpiresAt)}
                  </strong>
                  , à la fin du dernier abonnement actif.
                </p>
              </div>
              <div className="mt-4 flex flex-col items-start gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelDeletion}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Annulation…" : "Annuler la suppression"}
                </Button>
                {cancelError && (
                  <p role="alert" className="font-body text-body-16 text-destructive">
                    {cancelError}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 font-body text-body-16 text-muted-foreground">
                Cette action est <strong className="text-foreground">irréversible</strong>. Ton
                profil sera anonymisé. Les données de facturation seront conservées conformément aux
                obligations légales.
              </p>
              {hasActiveSubs && (
                <p className="mt-3 font-body text-body-16 text-muted-foreground">
                  Tu as actuellement{" "}
                  <strong className="text-foreground">
                    {deletionStatus?.activeSubscriptions} abonné
                    {(deletionStatus?.activeSubscriptions ?? 0) > 1 ? "s" : ""}
                  </strong>{" "}
                  actif{(deletionStatus?.activeSubscriptions ?? 0) > 1 ? "s" : ""}. Ta suppression
                  sera <strong className="text-foreground">programmée</strong> et deviendra
                  effective le{" "}
                  <strong className="text-foreground">
                    {formatDate(deletionStatus?.lastSubExpiresAt)}
                  </strong>
                  . Tu pourras l&apos;annuler à tout moment d&apos;ici là.
                </p>
              )}
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  className="!border-destructive/60 !text-destructive hover:!bg-destructive/10"
                >
                  {hasActiveSubs ? "Programmer la suppression" : "Supprimer mon compte"}
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      <DeleteAccountModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        userEmail={user.email}
        onConfirm={handleConfirmDelete}
        mode={hasActiveSubs ? "scheduled" : "immediate"}
        lastSubExpiresAt={deletionStatus?.lastSubExpiresAt ?? null}
        activeSubscriptions={deletionStatus?.activeSubscriptions ?? 0}
      />
    </>
  );
}
