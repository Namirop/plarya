-- AlterTable
ALTER TABLE "experts" ADD COLUMN     "subCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
