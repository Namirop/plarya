import Stripe from "stripe";

// Version d'API figée (celle par défaut de stripe-node 22) : une mise à jour
// du SDK ne change pas silencieusement la forme des payloads. À faire évoluer
// avec le SDK, après lecture du changelog (https://docs.stripe.com/upgrades).
export const stripe: Stripe.Stripe = Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

/**
 * Tag `metadata.app` posé sur chaque Checkout Session. Le compte Stripe peut
 * être partagé avec une autre application : Stripe livre alors chaque
 * événement à tous les webhooks du compte, et la signature ne permet pas de
 * les distinguer. billing-service acquitte sans traiter les sessions dont le
 * tag diffère.
 */
export const STRIPE_APP_TAG = "plarya";
