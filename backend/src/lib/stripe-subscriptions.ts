import { logger } from "./logger";
import { stripe } from "./stripe";

/** Stripe renvoie `resource_missing` pour un abonnement déjà supprimé. */
function isMissingSubscription(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "resource_missing"
  );
}

/**
 * Arrête le renouvellement d'un abonnement Stripe : l'accès court jusqu'à la
 * fin de la période payée, puis Stripe envoie `customer.subscription.deleted`.
 * Un abonnement déjà supprimé côté Stripe n'est pas une erreur.
 */
export async function cancelSubscriptionAtPeriodEnd(stripeSubId: string): Promise<void> {
  try {
    await stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true });
  } catch (err) {
    if (isMissingSubscription(err)) {
      logger.warn({ stripeSubId }, "Stripe subscription already gone (cancel at period end)");
      return;
    }
    throw err;
  }
}

/** Arrête immédiatement un abonnement Stripe (suppression de compte). */
export async function cancelSubscriptionNow(stripeSubId: string): Promise<void> {
  try {
    await stripe.subscriptions.cancel(stripeSubId);
  } catch (err) {
    if (isMissingSubscription(err)) {
      logger.warn({ stripeSubId }, "Stripe subscription already gone (cancel now)");
      return;
    }
    throw err;
  }
}
