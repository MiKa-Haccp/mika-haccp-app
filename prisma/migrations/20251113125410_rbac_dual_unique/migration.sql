/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,principalId,role]` on the table `RbacAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RbacAssignment_tenantId_principalId_role_key" ON "RbacAssignment"("tenantId", "principalId", "role");
