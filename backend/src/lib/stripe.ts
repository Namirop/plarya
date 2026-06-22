import Stripe from "stripe";

// apiVersion pinnée : on évite que `npm update` ne change silencieusement
// la version d'API utilisée (Stripe peut introduire des changements de
// shape de payload ou de comportement d'un release à l'autre). Pinner
// rend les upgrades explicites et tracables en revue.
//
// Version actuelle : "2026-03-25.dahlia" (release name "dahlia").
// Date du pin : 2026-05-22 — alignée sur la version par défaut du SDK
// stripe-node 22.0.0 (cf. node_modules/stripe/cjs/apiVersion.d.ts →
// ApiVersion = "2026-03-25.dahlia"). À bumper consciemment quand on
// upgrade le SDK, après revue des changelog Stripe entre les deux.
//
// Ref : https://docs.stripe.com/upgrades / https://docs.stripe.com/api/versioning
export const stripe: Stripe.Stripe = Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * Tag d'application posé sur le `metadata.app` de chaque Checkout Session
 * créée par Plarya.
 *
 * Le compte Stripe est PARTAGÉ avec un autre produit. Stripe livre
 * chaque event à TOUS les webhooks du compte qui écoutent ce type
 * d'event — donc un paiement de l'autre produit tape aussi le webhook
 * Plarya, et inversement. La signature ne discrimine pas (le même
 * compte signe pour les deux endpoints).
 *
 * → checkout-service pose `app: STRIPE_APP_TAG` sur chaque session, et
 *   billing-service ignore (ack 200) toute checkout.session.completed
 *   dont le tag ne correspond pas. L'autre produit DOIT faire le miroir
 *   avec son propre tag.
 */
export const STRIPE_APP_TAG = "plarya";
