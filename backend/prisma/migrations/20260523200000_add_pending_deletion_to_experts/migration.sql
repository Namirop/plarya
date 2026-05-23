-- AlterTable
ALTER TABLE "experts" ADD COLUMN "pendingDeletionAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "experts_pendingDeletionAt_idx" ON "experts"("pendingDeletionAt");
