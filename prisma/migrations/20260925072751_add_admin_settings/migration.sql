/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `AdminUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "notifyAdminActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyStreakMilestones" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySuspiciousActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWeeklySummary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_phoneNumber_key" ON "AdminUser"("phoneNumber");
