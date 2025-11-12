-- CreateTable
CREATE TABLE "FormDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "schemaJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "formDefinitionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodRef" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "previousYearRef" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormInstance_formDefinitionId_fkey" FOREIGN KEY ("formDefinitionId") REFERENCES "FormDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formInstanceId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dataJson" JSONB NOT NULL,
    "completedBy" TEXT,
    "signatureType" TEXT,
    "signatureMeta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FormEntry_formInstanceId_fkey" FOREIGN KEY ("formInstanceId") REFERENCES "FormInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FormDefinition_tenantId_sectionKey_active_idx" ON "FormDefinition"("tenantId", "sectionKey", "active");

-- CreateIndex
CREATE INDEX "FormInstance_tenantId_marketId_periodRef_idx" ON "FormInstance"("tenantId", "marketId", "periodRef");

-- CreateIndex
CREATE UNIQUE INDEX "FormInstance_tenantId_marketId_formDefinitionId_periodRef_key" ON "FormInstance"("tenantId", "marketId", "formDefinitionId", "periodRef");

-- CreateIndex
CREATE UNIQUE INDEX "FormEntry_formInstanceId_date_key" ON "FormEntry"("formInstanceId", "date");
