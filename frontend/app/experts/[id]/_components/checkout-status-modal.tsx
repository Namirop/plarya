"use client";

import Link from "next/link";

import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { cn } from "@/lib/utils";

type CheckoutStatus = "polling" | "success" | "failed" | null;
type ResendState = "idle" | "sending" | "sent" | "error";

/**
 * Modale upsell / statut checkout (user loggé, retour Stripe). 3 états :
 *  - polling : paiement reçu, on attend la création de la Subscription
 *  - success : hasAccess true → upsell mensuel
 *  - failed  : 30s sans webhook → erreur + Réessayer / Renvoyer / Contact
 *
 * Fermable (X + Escape + bouton Fermer).
 */
export function CheckoutStatusModal({
  open,
  status,
  hasAccess,
  monthlyPrice,
  sessionId,
  retryResendState,
  onClose,
  onRetry,
  onResend,
  onSubscribe,
}: {
  open: boolean;
  status: CheckoutStatus;
  hasAccess: boolean;
  monthlyPrice: string;
  sessionId: string | null;
  retryResendState: ResendState;
  onClose: () => void;
  onRetry: () => void;
  onResend: () => void;
  onSubscribe: () => void;
}) {
  const { containerRef } = useModalA11y({ open, onClose });
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upsell-title"
        className={cn(
          "relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border bg-background p-8",
          status === "failed" ? "border-destructive/40" : "border-surface-elevated",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {status === "failed" ? (
          <>
            <h2
              id="upsell-title"
              className="text-center font-body text-[22px] font-bold text-destructive md:text-h4"
            >
              Paiement non confirmé
            </h2>
            <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
              Nous n&apos;avons pas reçu la confirmation de Stripe dans les délais habituels. Si tu
              as été débité, ton accès sera ajouté automatiquement dès que la confirmation arrive.
            </p>
            <p className="mt-2 text-center font-body text-body-16 text-muted-foreground/70">
              Tu peux réessayer la vérification ou demander un nouvel email de confirmation.
            </p>

            <div className="mt-6 space-y-3">
              <Button type="button" variant="primary" size="lg" onClick={onRetry} className="w-full">
                Réessayer
              </Button>

              {sessionId && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={onResend}
                  disabled={retryResendState !== "idle"}
                  className="w-full"
                >
                  {retryResendState === "sending" && "Envoi en cours…"}
                  {retryResendState === "sent" && "Email renvoyé !"}
                  {retryResendState === "error" && "Erreur, réessaie"}
                  {retryResendState === "idle" && "Renvoyer l'email"}
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="lg"
                render={<Link href="/contact" />}
                className="w-full"
              >
                Contacter le support
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-full cursor-pointer items-center justify-center font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
              >
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              id="upsell-title"
              className="text-center font-body text-[22px] font-bold text-foreground md:text-h4"
            >
              {status === "success" || hasAccess
                ? "Accès débloqué !"
                : "Paiement en cours de traitement…"}
            </h2>
            <p className="mt-2 flex items-center justify-center gap-2 font-body text-body-16 text-muted-foreground">
              {status === "polling" && !hasAccess && (
                <span
                  aria-hidden
                  className="size-4 animate-spin rounded-full border-2 border-surface-elevated border-t-accent"
                />
              )}
              <span>
                {status === "success" || hasAccess
                  ? "Envie de découvrir d'autres experts ?"
                  : "Vos sélections seront disponibles dans quelques instants."}
              </span>
            </p>

            <div className="mt-6 space-y-3">
              <Button variant="secondary" size="lg" render={<Link href="/" />} className="w-full">
                Voir tous les experts
              </Button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={onSubscribe}
                className="w-full"
              >
                S&apos;abonner ({monthlyPrice}€/mois)
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-full cursor-pointer items-center justify-center font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
