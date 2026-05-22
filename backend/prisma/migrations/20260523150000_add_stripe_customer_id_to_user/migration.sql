-- AlterTable : ajout stripeCustomerId (nullable, unique). NULL ne
-- viole pas la contrainte unique en PostgreSQL → safe pour les rows
-- existantes.
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
