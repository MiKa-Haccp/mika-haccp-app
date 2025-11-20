-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "marketId" TEXT,
    "lockedForMarkets" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FormDefinition" ("active", "categoryKey", "createdAt", "id", "label", "period", "schemaJson", "sectionKey", "tenantId", "updatedAt") SELECT "active", "categoryKey", "createdAt", "id", "label", "period", "schemaJson", "sectionKey", "tenantId", "updatedAt" FROM "FormDefinition";
DROP TABLE "FormDefinition";
ALTER TABLE "new_FormDefinition" RENAME TO "FormDefinition";
CREATE INDEX "FormDefinition_tenantId_sectionKey_active_idx" ON "FormDefinition"("tenantId", "sectionKey", "active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
