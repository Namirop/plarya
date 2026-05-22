-- AlterTable
ALTER TABLE "tipsters" ALTER COLUMN "monthlyPrice" SET DEFAULT 2900;

-- Backfill: tipsters seedés à 19€ (1900) → 29€ (2900). Le seed
-- historique posait monthlyPrice à 1900 ; le brief CLAUDE.md §1
-- impose 29€. On rattrape les rows existantes.
UPDATE "tipsters" SET "monthlyPrice" = 2900 WHERE "monthlyPrice" = 1900;
