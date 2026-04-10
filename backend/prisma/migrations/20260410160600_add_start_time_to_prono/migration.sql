/*
  Warnings:

  - Added the required column `startTime` to the `pronos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pronos" ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;
