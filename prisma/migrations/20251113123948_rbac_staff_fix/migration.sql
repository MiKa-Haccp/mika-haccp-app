/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,marketId,principalId,role]` on the table `RbacAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT,
    "username" TEXT,
    "pinHash" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StaffProfile" ("active", "createdAt", "id", "initials", "marketId", "pinHash", "tenantId", "updatedAt", "username") SELECT "active", "createdAt", "id", "initials", "marketId", "pinHash", "tenantId", "updatedAt", "username" FROM "StaffProfile";
DROP TABLE "StaffProfile";
ALTER TABLE "new_StaffProfile" RENAME TO "StaffProfile";
CREATE UNIQUE INDEX "StaffProfile_username_key" ON "StaffProfile"("username");
CREATE INDEX "StaffProfile_tenantId_marketId_active_idx" ON "StaffProfile"("tenantId", "marketId", "active");
CREATE UNIQUE INDEX "StaffProfile_tenantId_initials_key" ON "StaffProfile"("tenantId", "initials");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RbacAssignment_tenantId_marketId_principalId_role_key" ON "RbacAssignment"("tenantId", "marketId", "principalId", "role");
