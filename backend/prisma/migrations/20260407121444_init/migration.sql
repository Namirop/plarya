-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'TIPSTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PronoResult" AS ENUM ('PENDING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "PronoTeasing" AS ENUM ('PICK_SOLIDE', 'VALUE', 'SAFE', 'OPPORTUNITE', 'PICK_DU_JOUR', 'A_NE_PAS_RATER');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('DAY_PASS', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TipsterSubStatus" AS ENUM ('FREE', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('FOOTBALL', 'TENNIS', 'BASKETBALL', 'RUGBY', 'HOCKEY', 'MMA', 'BOXE', 'ESPORT', 'AUTRE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipsters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "bio" TEXT,
    "photoUrl" TEXT,
    "sports" "Sport"[],
    "dayPassPrice" INTEGER NOT NULL DEFAULT 300,
    "monthlyPrice" INTEGER NOT NULL DEFAULT 1900,
    "subStatus" "TipsterSubStatus" NOT NULL DEFAULT 'FREE',
    "subExpiresAt" TIMESTAMP(3),
    "warningMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipsters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronos" (
    "id" TEXT NOT NULL,
    "tipsterId" TEXT NOT NULL,
    "matchName" TEXT NOT NULL,
    "league" TEXT,
    "pick" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "teasing" "PronoTeasing" NOT NULL,
    "result" "PronoResult" NOT NULL DEFAULT 'PENDING',
    "argument" TEXT,
    "matchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipsterId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSessionId" TEXT,
    "stripeSubId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmakers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_links" (
    "id" TEXT NOT NULL,
    "bookmakerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tipsters_userId_key" ON "tipsters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tipsters_pseudo_key" ON "tipsters"("pseudo");

-- CreateIndex
CREATE INDEX "pronos_tipsterId_createdAt_idx" ON "pronos"("tipsterId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_tipsterId_idx" ON "subscriptions"("tipsterId");

-- CreateIndex
CREATE INDEX "subscriptions_expiresAt_idx" ON "subscriptions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookmakers_name_key" ON "bookmakers"("name");

-- AddForeignKey
ALTER TABLE "tipsters" ADD CONSTRAINT "tipsters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronos" ADD CONSTRAINT "pronos_tipsterId_fkey" FOREIGN KEY ("tipsterId") REFERENCES "tipsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tipsterId_fkey" FOREIGN KEY ("tipsterId") REFERENCES "tipsters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_bookmakerId_fkey" FOREIGN KEY ("bookmakerId") REFERENCES "bookmakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
