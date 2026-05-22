-- ============================================================
-- Rename tipster → expert
-- Renomme la table, les colonnes FK, les enums et toutes les
-- contraintes / indexes associés pour cohérence avec la nouvelle
-- nomenclature produit (cf. CLAUDE.md §1.1).
--
-- Migration 100 % non-destructive : AUCUN DROP, données préservées.
-- ============================================================

-- 1. Enum UserRole : rename value TIPSTER → EXPERT (data follows)
ALTER TYPE "UserRole" RENAME VALUE 'TIPSTER' TO 'EXPERT';

-- 2. Rename enum type TipsterSubStatus → ExpertSubStatus
ALTER TYPE "TipsterSubStatus" RENAME TO "ExpertSubStatus";

-- 3. Rename table tipsters → experts
ALTER TABLE "tipsters" RENAME TO "experts";

-- 4. Rename FK columns tipsterId → expertId
ALTER TABLE "pronos" RENAME COLUMN "tipsterId" TO "expertId";
ALTER TABLE "subscriptions" RENAME COLUMN "tipsterId" TO "expertId";

-- 5. Rename primary key + unique indexes
ALTER INDEX "tipsters_pkey" RENAME TO "experts_pkey";
ALTER INDEX "tipsters_userId_key" RENAME TO "experts_userId_key";
ALTER INDEX "tipsters_pseudo_key" RENAME TO "experts_pseudo_key";

-- 6. Rename secondary indexes touchant tipsterId
ALTER INDEX "pronos_tipsterId_createdAt_idx" RENAME TO "pronos_expertId_createdAt_idx";
ALTER INDEX "subscriptions_tipsterId_idx" RENAME TO "subscriptions_expertId_idx";

-- 7. Rename foreign key constraints
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_userId_fkey" TO "experts_userId_fkey";
ALTER TABLE "pronos" RENAME CONSTRAINT "pronos_tipsterId_fkey" TO "pronos_expertId_fkey";
ALTER TABLE "subscriptions" RENAME CONSTRAINT "subscriptions_tipsterId_fkey" TO "subscriptions_expertId_fkey";

-- 8. Rename CHECK NOT NULL constraints (Prisma 7 les nomme par {table}_{col}_not_null)
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_id_not_null" TO "experts_id_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_userId_not_null" TO "experts_userId_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_pseudo_not_null" TO "experts_pseudo_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_dayPassPrice_not_null" TO "experts_dayPassPrice_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_monthlyPrice_not_null" TO "experts_monthlyPrice_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_subStatus_not_null" TO "experts_subStatus_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_displayOrder_not_null" TO "experts_displayOrder_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_createdAt_not_null" TO "experts_createdAt_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_updatedAt_not_null" TO "experts_updatedAt_not_null";
ALTER TABLE "experts" RENAME CONSTRAINT "tipsters_viewsToday_not_null" TO "experts_viewsToday_not_null";
ALTER TABLE "pronos" RENAME CONSTRAINT "pronos_tipsterId_not_null" TO "pronos_expertId_not_null";
ALTER TABLE "subscriptions" RENAME CONSTRAINT "subscriptions_tipsterId_not_null" TO "subscriptions_expertId_not_null";
