import { Router } from "express";
import express from "express";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { sendAccessUnlockedEmail } from "../lib/emails";
import { createMagicLink } from "../lib/magic-link";
import type { Sport } from "../generated/prisma/enums";

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

          // Accept both new and legacy `purpose` for backward-compat
          // during the tipster→expert rollout. Anciennes sessions Stripe
          // créées avant le rename portent encore "become_tipster".
          if (purpose === "become_expert" || purpose === "become_tipster") {
            // Create expert account after payment
            const { pseudo, bio, sports: sportsJson } = metadata;
            const sports = JSON.parse(sportsJson) as Sport[];
            const stripeSubId = session.subscription as string;

            // Idempotence: check if expert already exists for this user
            const existingExpert = await prisma.expert.findUnique({
              where: { userId },
            });
            if (existingExpert) break;

            await prisma.$transaction([
              prisma.user.update({
                where: { id: userId },
                data: { role: "EXPERT" },
              }),
              prisma.expert.create({
                data: {
                  userId,
                  pseudo,
                  bio: bio || null,
                  sports,
                  subStatus: "ACTIVE",
                  subExpiresAt: new Date(Date.now() + QUARTER),
                  stripeSubId,
                },
              }),
            ]);
            console.log(`Expert created: ${pseudo} (user ${userId})`);
          } else {
            // User subscription (day pass / monthly)
            // expertId : nouveau nom de clé. Backward-compat avec
            // tipsterId pour les sessions Stripe pending pré-rename.
            const expertId = metadata.expertId || metadata.tipsterId;
            const { type } = metadata;

            // Idempotence
            const existing = await prisma.subscription.findFirst({
              where: { stripeSessionId: session.id },
            });
            if (existing) break;

            // Resolve userId: from metadata if logged in, or findOrCreate by email
            let resolvedUserId = metadata.userId;
            const email = metadata.email || session.customer_details?.email;

            if (!resolvedUserId && email) {
              const normalizedEmail = email.toLowerCase();
              let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
              if (!user) {
                user = await prisma.user.create({ data: { email: normalizedEmail } });
                console.log(`User auto-created: ${normalizedEmail}`);
              }
              resolvedUserId = user.id;
            }

            if (!resolvedUserId) {
              console.error("Webhook: no userId and no email in metadata/session");
              break;
            }

            if (type === "DAY_PASS") {
              await prisma.subscription.create({
                data: {
                  userId: resolvedUserId,
                  expertId,
                  type: "DAY_PASS",
                  status: "ACTIVE",
                  stripeSessionId: session.id,
                  expiresAt: new Date(Date.now() + DAY),
                },
              });
              console.log(`Day pass created for user ${resolvedUserId} → expert ${expertId}`);
            } else if (type === "MONTHLY") {
              const stripeSubId = session.subscription as string;
              await prisma.subscription.create({
                data: {
                  userId: resolvedUserId,
                  expertId,
                  type: "MONTHLY",
                  status: "ACTIVE",
                  stripeSessionId: session.id,
                  stripeSubId,
                  expiresAt: new Date(Date.now() + MONTH),
                },
              });
              console.log(`Monthly sub created for user ${resolvedUserId} → expert ${expertId}`);
            }

            // Fire-and-forget: send access unlocked email with magic link
            const [buyer, expertRecord] = await Promise.all([
              prisma.user.findUnique({ where: { id: resolvedUserId }, select: { email: true } }),
              prisma.expert.findUnique({ where: { id: expertId }, select: { pseudo: true } }),
            ]);
            if (buyer && expertRecord) {
              const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
              const magicToken = await createMagicLink(buyer.email);
              const magicLinkUrl = `${backendUrl}/auth/verify?token=${magicToken}`;
              sendAccessUnlockedEmail(
                buyer.email,
                expertRecord.pseudo,
                expertId,
                magicLinkUrl
              );
            }
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as unknown as { subscription?: string | null };
          const subscriptionId = invoice.subscription ?? null;
          if (!subscriptionId) break;

          // Check if it's an expert quarterly renewal
          const expert = await prisma.expert.findFirst({
            where: { stripeSubId: subscriptionId },
          });
          if (expert) {
            await prisma.expert.update({
              where: { id: expert.id },
              data: {
                subStatus: "ACTIVE",
                subExpiresAt: new Date(Date.now() + QUARTER),
              },
            });
            console.log(`Expert sub renewed: ${expert.pseudo}`);
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

          // Check if it's an expert sub
          const expert = await prisma.expert.findFirst({
            where: { stripeSubId: subscription.id },
          });
          if (expert) {
            await prisma.expert.update({
              where: { id: expert.id },
              data: { subStatus: "EXPIRED" },
            });
            console.log(`Expert sub expired: ${expert.pseudo}`);
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
