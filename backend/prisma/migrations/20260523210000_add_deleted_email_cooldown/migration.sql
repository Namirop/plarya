-- CreateTable
CREATE TABLE "deleted_email_cooldowns" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_email_cooldowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deleted_email_cooldowns_email_idx" ON "deleted_email_cooldowns"("email");

-- CreateIndex
CREATE INDEX "deleted_email_cooldowns_expiresAt_idx" ON "deleted_email_cooldowns"("expiresAt");
