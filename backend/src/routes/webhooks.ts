import { Router } from "express";
import express from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";

const router = Router();

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;
const QUARTER = 90 * DAY;

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).send("Signature invalide");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const metadata = session.metadata as Record<string, string>;
          const { userId, purpose } = metadata;

          if (purpose === "become_tipster") {
            // Create tipster account after payment
            const { pseudo, bio, sports: sportsJson } = metadata;
            const sports = JSON.parse(sportsJson) as string[];
            const stripeSubId = session.subscription as string;

            // Idempotence: check if tipster already exists for this user
            const existingTipster = await prisma.tipster.findUnique({
              where: { userId },
            });
            if (existingTipster) break;

            await prisma.$transaction([
              prisma.user.update({
                where: { id: userId },
                data: { role: "TIPSTER" },
              }),
              prisma.tipster.create({
                data: {
                  userId,
                  pseudo,
                  bio: bio || null,
                  sports: sports as any,
                  subStatus: "ACTIVE",
                  subExpiresAt: new Date(Date.now() + QUARTER),
                  stripeSubId,
                },
              }),
            ]);
            console.log(`Tipster created: ${pseudo} (user ${userId})`);
          } else {
            // User subscription (day pass / monthly)
            const { tipsterId, type } = metadata;

            // Idempotence
            const existing = await prisma.subscription.findFirst({
              where: { stripeSessionId: session.id },
            });
            if (existing) break;

            if (type === "DAY_PASS") {
              await prisma.subscription.create({
                data: {
                  userId,
                  tipsterId,
                  type: "DAY_PASS",
                  status: "ACTIVE",
                  stripeSessionId: session.id,
                  expiresAt: new Date(Date.now() + DAY),
                },
              });
              console.log(`Day pass created for user ${userId} → tipster ${tipsterId}`);
            } else if (type === "MONTHLY") {
              const stripeSubId = session.subscription as string;
              await prisma.subscription.create({
                data: {
                  userId,
                  tipsterId,
                  type: "MONTHLY",
                  status: "ACTIVE",
                  stripeSessionId: session.id,
                  stripeSubId,
                  expiresAt: new Date(Date.now() + MONTH),
                },
              });
              console.log(`Monthly sub created for user ${userId} → tipster ${tipsterId}`);
            }
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as unknown as { subscription?: string | null };
          const subscriptionId = invoice.subscription ?? null;
          if (!subscriptionId) break;

          // Check if it's a tipster quarterly renewal
          const tipster = await prisma.tipster.findFirst({
            where: { stripeSubId: subscriptionId },
          });
          if (tipster) {
            await prisma.tipster.update({
              where: { id: tipster.id },
              data: {
                subStatus: "ACTIVE",
                subExpiresAt: new Date(Date.now() + QUARTER),
              },
            });
            console.log(`Tipster sub renewed: ${tipster.pseudo}`);
            break;
          }

          // Otherwise it's a user subscription renewal
          const sub = await prisma.subscription.findFirst({
            where: { stripeSubId: subscriptionId },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: "ACTIVE",
                expiresAt: new Date(Date.now() + MONTH),
              },
            });
            console.log(`Subscription renewed: ${sub.id}`);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;

          // Check if it's a tipster sub
          const tipster = await prisma.tipster.findFirst({
            where: { stripeSubId: subscription.id },
          });
          if (tipster) {
            await prisma.tipster.update({
              where: { id: tipster.id },
              data: { subStatus: "EXPIRED" },
            });
            console.log(`Tipster sub expired: ${tipster.pseudo}`);
            break;
          }

          // Otherwise user sub
          const sub = await prisma.subscription.findFirst({
            where: { stripeSubId: subscription.id },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: "CANCELLED" },
            });
            console.log(`Subscription cancelled: ${sub.id}`);
          }
          break;
        }
      }
    } catch (err) {
      console.error("Webhook handler error:", err);
    }

    res.json({ received: true });
  }
);

export default router;
