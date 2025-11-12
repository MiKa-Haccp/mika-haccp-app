-- CreateTable
CREATE TABLE "RbacAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT,
    "principalId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RbacAssignment_tenantId_marketId_principalId_role_idx" ON "RbacAssignment"("tenantId", "marketId", "principalId", "role");
