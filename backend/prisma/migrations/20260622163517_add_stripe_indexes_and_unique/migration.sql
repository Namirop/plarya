-- CreateIndex
-- Index sur Expert.stripeSubId : utilisé en findFirst dans
-- billing-service (handleInvoicePaid, handleSubscriptionDeleted) à
-- chaque webhook renewal/cancel d'expert.
CREATE INDEX "experts_stripeSubId_idx" ON "experts"("stripeSubId");

-- CreateIndex
-- Contrainte unique sur Subscription.stripeSessionId. Un Checkout
-- Session ID Stripe (cs_xxx) est unique par construction (1 session =
-- 1 paiement). En PostgreSQL, NULL ne viole pas une contrainte unique
-- → safe pour les rows existantes sans session. Bonus : garantit
-- l'idempotence du handler checkout au niveau DB (anti double-insert
-- en cas de double livraison concurrente du webhook).
CREATE UNIQUE INDEX "subscriptions_stripeSessionId_key" ON "subscriptions"("stripeSessionId");

-- CreateIndex
-- Index sur Subscription.stripeSubId : utilisé en findFirst dans
-- billing-service (handleInvoicePaid renewal mensuel).
CREATE INDEX "subscriptions_stripeSubId_idx" ON "subscriptions"("stripeSubId");
