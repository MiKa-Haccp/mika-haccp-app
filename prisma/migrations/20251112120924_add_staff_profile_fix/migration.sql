-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT,
    "username" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_username_key" ON "StaffProfile"("username");

-- CreateIndex
CREATE INDEX "StaffProfile_tenantId_marketId_active_idx" ON "StaffProfile"("tenantId", "marketId", "active");
