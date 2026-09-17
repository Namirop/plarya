import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  subscription: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  expert: { findUnique: vi.fn(), update: vi.fn() },
}));
const stripeSubscriptions = vi.hoisted(() => ({ cancelSubscriptionAtPeriodEnd: vi.fn() }));

vi.mock("../lib/prisma", () => ({ prisma }));
vi.mock("../lib/stripe-subscriptions", () => stripeSubscriptions);

import { SubscriptionNotCancellableError } from "./errors";
import { cancelOwnExpertSubscription, cancelOwnSubscription, listOwnSubscriptions } from "./subscription-service";

const future = () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cancelOwnSubscription", () => {
  const activeMonthly = () => ({
    id: "sub_1",
    type: "MONTHLY",
    status: "ACTIVE",
    expiresAt: future(),
    stripeSubId: "sub_stripe_1",
    cancelAtPeriodEnd: false,
  });

  it("arrête le renouvellement chez Stripe puis enregistre la résiliation", async () => {
    prisma.subscription.findFirst.mockResolvedValue(activeMonthly());

    const result = await cancelOwnSubscription("user_1", "sub_1");

    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "sub_1", userId: "user_1" } }),
    );
    expect(stripeSubscriptions.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith("sub_stripe_1");
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { cancelAtPeriodEnd: true },
    });
    expect(result.cancelAtPeriodEnd).toBe(true);
  });

  it.each([
    ["introuvable ou appartenant à un autre utilisateur", null],
    ["pass journée", { ...activeMonthly(), type: "DAY_PASS" }],
    ["déjà résilié", { ...activeMonthly(), cancelAtPeriodEnd: true }],
    ["sans abonnement Stripe", { ...activeMonthly(), stripeSubId: null }],
    ["expiré", { ...activeMonthly(), expiresAt: new Date(Date.now() - 1000) }],
  ])("refuse un abonnement %s, sans appeler Stripe", async (_label, sub) => {
    prisma.subscription.findFirst.mockResolvedValue(sub);

    await expect(cancelOwnSubscription("user_1", "sub_1")).rejects.toBeInstanceOf(
      SubscriptionNotCancellableError,
    );
    expect(stripeSubscriptions.cancelSubscriptionAtPeriodEnd).not.toHaveBeenCalled();
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("n'enregistre rien si Stripe échoue", async () => {
    prisma.subscription.findFirst.mockResolvedValue(activeMonthly());
    stripeSubscriptions.cancelSubscriptionAtPeriodEnd.mockRejectedValueOnce(new Error("stripe down"));

    await expect(cancelOwnSubscription("user_1", "sub_1")).rejects.toThrow("stripe down");
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});

describe("cancelOwnExpertSubscription", () => {
  const activeExpert = () => ({
    id: "exp_1",
    deletedAt: null,
    subStatus: "ACTIVE",
    subExpiresAt: future(),
    stripeSubId: "sub_stripe_exp",
    subCancelAtPeriodEnd: false,
  });

  it("résilie l'abonnement expert à la fin de la période", async () => {
    prisma.expert.findUnique.mockResolvedValue(activeExpert());

    await cancelOwnExpertSubscription("user_1");

    expect(stripeSubscriptions.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith("sub_stripe_exp");
    expect(prisma.expert.update).toHaveBeenCalledWith({
      where: { id: "exp_1" },
      data: { subCancelAtPeriodEnd: true },
    });
  });

  it("refuse un compte expert offert (FREE)", async () => {
    prisma.expert.findUnique.mockResolvedValue({ ...activeExpert(), subStatus: "FREE", stripeSubId: null });

    await expect(cancelOwnExpertSubscription("user_1")).rejects.toBeInstanceOf(
      SubscriptionNotCancellableError,
    );
    expect(stripeSubscriptions.cancelSubscriptionAtPeriodEnd).not.toHaveBeenCalled();
  });
});

describe("listOwnSubscriptions", () => {
  it("n'expose pas l'identifiant Stripe et calcule la possibilité de résilier", async () => {
    prisma.subscription.findMany.mockResolvedValue([
      {
        id: "sub_1",
        type: "MONTHLY",
        status: "ACTIVE",
        expiresAt: future(),
        cancelAtPeriodEnd: false,
        stripeSubId: "sub_stripe_1",
      },
      {
        id: "sub_2",
        type: "DAY_PASS",
        status: "ACTIVE",
        expiresAt: future(),
        cancelAtPeriodEnd: false,
        stripeSubId: null,
      },
    ]);

    const [monthly, dayPass] = await listOwnSubscriptions("user_1");

    expect(monthly).not.toHaveProperty("stripeSubId");
    expect(monthly.canCancel).toBe(true);
    expect(dayPass.canCancel).toBe(false);
  });
});
