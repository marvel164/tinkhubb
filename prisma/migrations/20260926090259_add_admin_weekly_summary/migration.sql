-- CreateTable
CREATE TABLE "AdminWeeklySummary" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminWeeklySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminWeeklySummary_weekStart_key" ON "AdminWeeklySummary"("weekStart");

-- CreateIndex
CREATE INDEX "AdminWeeklySummary_weekStart_idx" ON "AdminWeeklySummary"("weekStart");
