-- CreateTable
CREATE TABLE "DokuSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT,
    "categoryKey" TEXT NOT NULL DEFAULT 'dokumentation',
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "DokuSection_tenantId_marketId_active_idx" ON "DokuSection"("tenantId", "marketId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DokuSection_tenantId_marketId_slug_key" ON "DokuSection"("tenantId", "marketId", "slug");
