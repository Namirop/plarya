import express, { Router } from "express";

import { logger } from "../lib/logger";
import { stripe } from "../lib/stripe";
import {
  isEventAlreadyProcessed,
  processStripeEvent,
  type StripeEvent,
} from "../services/billing-service";

/**
 * Routes /webhooks — endpoint Stripe + dispatcher idempotent.
 *
 * Responsabilités HTTP uniquement :
 *  1. Body raw (signature Stripe nécessite le payload brut, pas JSON
 *     parsé) — `express.raw({ type: "application/json" })`.
 *  2. Vérification signature → 400 si invalide (Stripe ne retry pas
 *     en 400, un payload truqué ne deviendra pas valide au retry).
 *  3. Lookup idempotence event-level → 200 silencieux si déjà traité.
 *  4. Dispatch sur billing-service.processStripeEvent.
 *
 * PAS de try/catch global autour du processStripeEvent : si la logique
 * métier échoue (DB down, contrainte unique, etc.), on laisse remonter
 * → Express renvoie 500 → Stripe retry (jusqu'à 3 jours par défaut).
 * Les transactions internes garantissent qu'un succès est atomiquement
 * enregistré, ou rien n'est enregistré (et Stripe retentera).
 */

const router = Router();

const webhookLogger = logger.child({ context: "webhook" });

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: StripeEvent;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    webhookLogger.error({ err }, "Signature verification failed");
    res.status(400).send("Signature invalide");
    return;
  }

  if (await isEventAlreadyProcessed(event.id)) {
    webhookLogger.info(
      { eventId: event.id, eventType: event.type },
      "Event already processed, skipping",
    );
    res.json({ received: true });
    return;
  }

  // processStripeEvent throw → Express renvoie 500 → Stripe retry.
  // Pas de catch ici : on veut justement laisser remonter pour
  // déclencher le retry mechanism.
  await processStripeEvent(event);

  res.json({ received: true });
});

export default router;
