import express, { Router } from "express";

import { logger } from "../lib/logger";
import { stripe } from "../lib/stripe";
import {
  isEventAlreadyProcessed,
  processStripeEvent,
  type StripeEvent,
} from "../services/billing-service";

/**
 * Webhook Stripe : corps brut (requis par la vérification de signature),
 * 400 si la signature est invalide, 200 immédiat si l'événement est déjà
 * traité, sinon délégation à billing-service.
 *
 * Pas de try/catch autour de processStripeEvent : une erreur produit un 500
 * et Stripe renvoie l'événement plus tard. Le traitement et l'enregistrement
 * de l'événement sont transactionnels, un rejeu repart donc d'un état propre.
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

  await processStripeEvent(event);

  res.json({ received: true });
});

export default router;
