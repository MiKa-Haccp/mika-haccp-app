/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,initials]` on the table `StaffProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_tenantId_initials_key" ON "StaffProfile"("tenantId", "initials");
