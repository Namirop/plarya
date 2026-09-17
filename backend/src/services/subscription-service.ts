import { prisma } from "../lib/prisma";
import { cancelSubscriptionAtPeriodEnd } from "../lib/stripe-subscriptions";

import { ExpertProfileNotFoundError, SubscriptionNotCancellableError } from "./errors";

/** Abonnement actif et non échu de l'utilisateur sur cet expert. */
export async function hasActiveSubscription(userId: string, expertId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      expertId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return !!sub;
}

/**
 * Polling anonyme après paiement : indique seulement si le webhook a créé
 * l'abonnement de cette session Stripe, sans autre donnée.
 */
export async function isCheckoutSessionReady(stripeSessionId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSessionId },
    select: { id: true },
  });
  return !!sub;
}

/** Abonnements de l'utilisateur, tous statuts, avec les infos publiques de l'expert. */
export async function listOwnSubscriptions(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      expertId: true,
      type: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      cancelAtPeriodEnd: true,
      stripeSubId: true,
      expert: {
        select: { id: true, pseudo: true, photoUrl: true, sports: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // L'identifiant Stripe reste côté serveur : le client reçoit seulement
  // de quoi afficher le bouton de résiliation.
  return subscriptions.map(({ stripeSubId, ...sub }) => ({
    ...sub,
    canCancel:
      sub.type === "MONTHLY" &&
      sub.status === "ACTIVE" &&
      !sub.cancelAtPeriodEnd &&
      !!stripeSubId &&
      sub.expiresAt > new Date(),
  }));
}

/**
 * Résilie un abonnement mensuel de l'utilisateur : plus de renouvellement,
 * accès conservé jusqu'à la fin de la période payée.
 */
export async function cancelOwnSubscription(userId: string, subscriptionId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
    select: {
      id: true,
      type: true,
      status: true,
      expiresAt: true,
      stripeSubId: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (
    !sub ||
    sub.type !== "MONTHLY" ||
    sub.status !== "ACTIVE" ||
    sub.cancelAtPeriodEnd ||
    !sub.stripeSubId ||
    sub.expiresAt <= new Date()
  ) {
    throw new SubscriptionNotCancellableError();
  }

  await cancelSubscriptionAtPeriodEnd(sub.stripeSubId);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });

  return { id: sub.id, cancelAtPeriodEnd: true, expiresAt: sub.expiresAt };
}

/**
 * Résilie l'abonnement expert trimestriel : l'expert garde l'accès à son
 * espace jusqu'à l'échéance, puis ne peut plus publier ni vendre.
 */
export async function cancelOwnExpertSubscription(userId: string) {
  const expert = await prisma.expert.findUnique({
    where: { userId },
    select: {
      id: true,
      deletedAt: true,
      subStatus: true,
      subExpiresAt: true,
      stripeSubId: true,
      subCancelAtPeriodEnd: true,
    },
  });

  if (!expert || expert.deletedAt) {
    throw new ExpertProfileNotFoundError();
  }
  if (expert.subStatus !== "ACTIVE" || !expert.stripeSubId || expert.subCancelAtPeriodEnd) {
    throw new SubscriptionNotCancellableError();
  }

  await cancelSubscriptionAtPeriodEnd(expert.stripeSubId);
  await prisma.expert.update({
    where: { id: expert.id },
    data: { subCancelAtPeriodEnd: true },
  });

  return { cancelAtPeriodEnd: true, expiresAt: expert.subExpiresAt };
}
