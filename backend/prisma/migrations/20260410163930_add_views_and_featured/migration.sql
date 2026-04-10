-- AlterTable
ALTER TABLE "pronos" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tipsters" ADD COLUMN     "viewsToday" INTEGER NOT NULL DEFAULT 0;
