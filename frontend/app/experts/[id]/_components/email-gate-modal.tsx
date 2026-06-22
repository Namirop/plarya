"use client";

import Link from "next/link";

import { CheckCircle } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { cn } from "@/lib/utils";

type GateStatus = "polling" | "ready" | "failed";
type ResendState = "idle" | "sending" | "sent" | "error";

/**
 * Modale email-gate (flow non-loggé après Stripe Checkout). 3 états :
 *  - polling : on attend la confirmation du webhook (spinner)
 *  - ready   : webhook reçu → "Paiement confirmé, ouvre ton email"
 *  - failed  : 30s sans webhook → message d'erreur + Réessayer/Contact
 *
 * Flow FORCÉ post-paiement : pas de fermeture (pas de X, Escape
 * désactivé). Garde tout de même focus-trap + scroll-lock + a11y via
 * useModalA11y.
 */
export function EmailGateModal({
  open,
  status,
  sessionId,
  resendState,
  onResend,
  onRetry,
}: {
  open: boolean;
  status: GateStatus;
  sessionId: string | null;
  resendState: ResendState;
  onResend: () => void;
  onRetry: () => void;
}) {
  const { containerRef } = useModalA11y({ open, onClose: () => {}, disableEscape: true });
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-gate-title"
        className={cn(
          "relative z-10 mx-4 w-full max-w-[480px] rounded-2xl border bg-background p-8",
          status === "failed" ? "border-destructive/40" : "border-surface-elevated",
        )}
      >
        {status === "polling" && (
          <>
            <div className="flex justify-center">
              <span
                aria-hidden
                className="size-12 animate-spin rounded-full border-4 border-surface-elevated border-t-accent"
              />
            </div>
            <h2
              id="email-gate-title"
              className="mt-4 text-center font-body text-[22px] font-bold text-foreground md:text-h4"
            >
              Vérification du paiement…
            </h2>
            <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
              Stripe nous confirme ton paiement. Cela prend quelques secondes.
            </p>
          </>
        )}

        {status === "ready" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="size-12 text-foreground" aria-hidden />
            </div>
            <h2
              id="email-gate-title"
              className="mt-4 text-center font-body text-[22px] font-bold text-foreground md:text-h4"
            >
              Paiement confirmé
            </h2>
            <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
              Pour accéder à tes analyses, ouvre l&apos;email que nous venons de t&apos;envoyer et
              clique sur le lien de connexion.
            </p>
            <p className="mt-2 text-center font-body text-body-16 text-muted-foreground/70">
              Pense à vérifier tes spams si tu ne le trouves pas.
            </p>
            <div className="mt-6">
              <Button variant="secondary" size="lg" render={<Link href="/" />} className="w-full">
                Retourner à l&apos;accueil
              </Button>

              {sessionId && (
                <div className="mt-4 text-center">
                  <p className="font-body text-body-16 text-muted-foreground/70">
                    Tu n&apos;as pas reçu l&apos;email ?
                  </p>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resendState !== "idle"}
                    className="mt-1 cursor-pointer font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {resendState === "sending" && "Envoi en cours…"}
                    {resendState === "sent" && "Email renvoyé !"}
                    {resendState === "error" && "Erreur, contacte-nous"}
                    {resendState === "idle" && "Renvoyer le lien"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <h2
              id="email-gate-title"
              className="text-center font-body text-[22px] font-bold text-destructive md:text-h4"
            >
              Paiement non confirmé
            </h2>
            <p className="mt-3 text-center font-body text-body-16 text-muted-foreground">
              Nous n&apos;avons pas reçu la confirmation de Stripe dans les délais habituels. Si tu
              as été débité, ton accès te sera envoyé par email dès que la confirmation arrive.
            </p>
            <div className="mt-6 space-y-3">
              {sessionId && (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={onRetry}
                  className="w-full"
                >
                  Réessayer
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
              <Button
                type="button"
                variant="secondary"
                size="lg"
                render={<Link href="/" />}
                className="w-full"
              >
                Retourner à l&apos;accueil
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
