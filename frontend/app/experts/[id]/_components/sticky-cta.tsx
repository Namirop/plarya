import { Button } from "@/components/ui/button";

/**
 * CTA collant en bas de page (DAY_PASS / MONTHLY). Rendu uniquement
 * quand l'user n'a PAS accès. 3 cas : expert en suppression programmée,
 * toutes les analyses commencées, ou les boutons d'achat.
 */
export function StickyCta({
  hasAccess,
  isPendingDeletion,
  allAnalysesStarted,
  pendingPronosCount,
  dayPrice,
  monthlyPrice,
  checkoutLoading,
  onCheckout,
}: {
  hasAccess: boolean;
  isPendingDeletion: boolean;
  allAnalysesStarted: boolean;
  pendingPronosCount: number;
  dayPrice: string;
  monthlyPrice: string;
  checkoutLoading: boolean;
  onCheckout: (type: "DAY_PASS" | "MONTHLY") => void;
}) {
  if (hasAccess) return null;

  return (
    <div className="sticky bottom-0 z-40 border-t border-surface-elevated bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-2 px-4 py-4 md:px-6">
        {isPendingDeletion ? (
          <p className="text-center font-body text-body-16 text-muted-foreground">
            Cet expert ne prend plus de nouveaux abonnés.
          </p>
        ) : allAnalysesStarted ? (
          <p className="text-center font-body text-body-16 text-muted-foreground">
            Toutes les analyses du jour sont terminées, reviens demain
          </p>
        ) : (
          <>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={checkoutLoading}
              onClick={() => onCheckout("DAY_PASS")}
              className="w-full"
            >
              {checkoutLoading
                ? "..."
                : `Accéder aux ${pendingPronosCount} ${
                    pendingPronosCount === 1 ? "analyse" : "analyses"
                  } (${dayPrice}€)`}
            </Button>
            <button
              type="button"
              disabled={checkoutLoading}
              onClick={() => onCheckout("MONTHLY")}
              className="cursor-pointer font-body text-body-16 text-muted-foreground transition-colors hover:text-foreground"
            >
              ou abonnement mensuel {monthlyPrice}€
            </button>
          </>
        )}
      </div>
    </div>
  );
}
