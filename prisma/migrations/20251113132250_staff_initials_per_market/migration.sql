/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,marketId,initials]` on the table `StaffProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "StaffProfile_tenantId_initials_key";

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_tenantId_marketId_initials_key" ON "StaffProfile"("tenantId", "marketId", "initials");
