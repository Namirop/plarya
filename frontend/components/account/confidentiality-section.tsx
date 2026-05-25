"use client";

import { useEffect, useState, type ComponentType } from "react";

import { useRouter } from "next/navigation";

import { Download, type IconProps, Lock, Trash, WarningCircle } from "@phosphor-icons/react";

import { DeleteAccountModal } from "@/components/account/delete-account-modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { apiFetch, apiGet, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";

// Section "Confidentialité & données" — remplace l'ex DangerZone. Le
// rouge agressif (bordure + titre destructive) a été retiré au profit
// d'un ton muted/neutre cohérent avec le reste du dashboard. Le rouge
// destructive ne subsiste que sur l'ACTION finale "Supprimer", et de
// manière contenue (texte + bordure du bouton uniquement).
//
// Logique métier (export RGPD, suppression immédiate vs scheduled,
// annulation de scheduled) reprise verbatim de l'ancienne DangerZone —
// seul le rendu visuel change.

interface DeletionStatus {
  canDelete: boolean;
  reason?: "active_subscriptions" | "scheduled";
  activeSubscriptions?: number;
  pendingDeletionAt?: string | null;
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

export function ConfidentialitySection() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ text: string; isError: boolean } | null>(null);
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
      setExportMsg({ text: err instanceof Error ? err.message : "Erreur", isError: true });
    } finally {
      setExportLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!user) return;
    const res = await apiFetch("/auth/me", { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      let message = `Erreur ${res.status}`;
      try {
        const body = JSON.parse(text) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // pas du JSON — on garde le code HTTP
      }
      throw new Error(message);
    }
    if (res.status === 202) {
      setConfirmOpen(false);
      refreshDeletionStatus();
      return;
    }
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
      <section className="mt-16 md:mt-20">
        {/* Header section — pattern cohérent avec les autres sections
            (gold bar à gauche). Ton muted-foreground (pas destructive)
            pour ne pas crier "danger". */}
        <div className="flex items-center gap-3">
          <span aria-hidden className="block h-7 w-px bg-muted-foreground/50" />
          <h2 className="font-body text-[22px] font-bold text-foreground md:text-[24px]">
            Confidentialité &amp; données
          </h2>
        </div>
        <p className="mt-3 font-body text-body-16 text-muted-foreground">
          Conformément au RGPD, tu peux à tout moment exporter ou supprimer tes données. Les
          données de facturation sont conservées séparément, selon les obligations légales.
        </p>

        {/* Banner scheduled — affiché à la place des tuiles quand une
            suppression est déjà programmée. */}
        {isScheduled ? (
          <div className="mt-6 rounded-2xl border border-surface-elevated bg-black/40 p-6 md:p-8">
            <div className="flex items-start gap-3">
              <WarningCircle size={22} className="shrink-0 text-foreground" />
              <div className="flex-1">
                <p className="font-body text-h5 text-foreground">Suppression programmée</p>
                <p className="mt-2 font-body text-body-16 text-muted-foreground">
                  Effective le{" "}
                  <strong className="text-foreground">
                    {formatDate(deletionStatus?.lastSubExpiresAt)}
                  </strong>
                  , à la fin du dernier abonnement actif. Ton profil n&apos;apparaît plus dans les
                  listings publics et n&apos;accepte plus de nouveaux abonnés d&apos;ici là.
                </p>
                <div className="mt-5 flex flex-col items-start gap-2">
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
              </div>
            </div>
          </div>
        ) : (
          // 2 tuiles côte-à-côte : Export RGPD + Supprimer compte. À md
          // empilement vertical pour rester confortable sur mobile.
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SettingsTile
              icon={Download}
              title="Exporter mes données"
              description="Télécharge un fichier JSON avec ton profil, tes abonnements et l'historique de tes achats."
              footer={
                exportMsg && (
                  <p
                    role="status"
                    className={cn(
                      "font-body text-body-16",
                      exportMsg.isError ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {exportMsg.text}
                  </p>
                )
              }
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  disabled={exportLoading}
                >
                  {exportLoading ? "Génération…" : "Télécharger"}
                </Button>
              }
            />

            <SettingsTile
              icon={Trash}
              tone="alert"
              title="Supprimer mon compte"
              description={
                hasActiveSubs ? (
                  <>
                    Tu as actuellement{" "}
                    <strong className="text-foreground">
                      {deletionStatus?.activeSubscriptions} abonné
                      {(deletionStatus?.activeSubscriptions ?? 0) > 1 ? "s" : ""}
                    </strong>{" "}
                    actif{(deletionStatus?.activeSubscriptions ?? 0) > 1 ? "s" : ""}. La
                    suppression sera <strong className="text-foreground">programmée</strong> et
                    deviendra effective le{" "}
                    <strong className="text-foreground">
                      {formatDate(deletionStatus?.lastSubExpiresAt)}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Action <strong className="text-foreground">irréversible</strong>. Ton profil
                    sera anonymisé immédiatement.
                  </>
                )
              }
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  className="!border-destructive/40 !text-destructive hover:!bg-destructive/5 hover:!border-destructive/60"
                >
                  {hasActiveSubs ? "Programmer la suppression" : "Supprimer mon compte"}
                </Button>
              }
            />
          </div>
        )}
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

// ────────────────────────────────────────────────────────────────────
// SettingsTile — pattern interne (réutilisable, pas exporté).
// Tone "default" : neutre. Tone "alert" : ajoute un trait latéral
// gauche destructive (subtil, pas une bordure complète qui crierait
// danger). L'action elle-même porte le rouge.
// ────────────────────────────────────────────────────────────────────

interface SettingsTileProps {
  icon: ComponentType<IconProps>;
  title: string;
  description: React.ReactNode;
  action: React.ReactNode;
  footer?: React.ReactNode;
  tone?: "default" | "alert";
}

function SettingsTile({
  icon: Icon,
  title,
  description,
  action,
  footer,
  tone = "default",
}: SettingsTileProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-surface-elevated bg-black/40 p-5 md:p-6",
        "transition-colors duration-200",
        tone === "alert" && "border-l-2 border-l-destructive/40 hover:border-l-destructive/60",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          weight={tone === "alert" ? "regular" : "regular"}
          className={cn(
            "mt-0.5 shrink-0",
            tone === "alert" ? "text-destructive/70" : "text-foreground",
          )}
        />
        <h3 className="font-body text-h5 text-foreground">{title}</h3>
      </div>
      <p className="mt-3 font-body text-body-16 leading-[1.45] text-muted-foreground">
        {description}
      </p>
      <div className="mt-5 flex flex-col items-start gap-2">{action}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

// Lock icon réexporté pour usage externe (header section optionnel —
// laissé sous le coude si on veut un icon au-dessus du titre plus tard).
export { Lock };
