-- AlterTable
ALTER TABLE "tipsters" ADD COLUMN     "dailyNote" TEXT,
ADD COLUMN     "dailyNoteDate" TIMESTAMP(3),
ADD COLUMN     "stripeSubId" TEXT;

-- CreateTable
CREATE TABLE "prono_bookmaker_odds" (
    "id" TEXT NOT NULL,
    "pronoId" TEXT NOT NULL,
    "bookmakerId" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "prono_bookmaker_odds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prono_bookmaker_odds_pronoId_idx" ON "prono_bookmaker_odds"("pronoId");

-- CreateIndex
CREATE UNIQUE INDEX "prono_bookmaker_odds_pronoId_bookmakerId_key" ON "prono_bookmaker_odds"("pronoId", "bookmakerId");

-- AddForeignKey
ALTER TABLE "prono_bookmaker_odds" ADD CONSTRAINT "prono_bookmaker_odds_pronoId_fkey" FOREIGN KEY ("pronoId") REFERENCES "pronos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prono_bookmaker_odds" ADD CONSTRAINT "prono_bookmaker_odds_bookmakerId_fkey" FOREIGN KEY ("bookmakerId") REFERENCES "bookmakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
