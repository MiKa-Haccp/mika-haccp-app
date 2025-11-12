import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenantId = "T1"; // Beispiel-Tenant

  await prisma.formDefinition.upsert({
    where: { id: "DEF_ZUST_MON" },
    create: {
      id: "DEF_ZUST_MON",
      tenantId,
      categoryKey: "dokumentation",
      sectionKey: "zust",
      label: "Zuständigkeiten (Monat)",
      period: "monthly",
      schemaJson: {
        fields: [
          { key: "verantwortlich", type: "text", label: "Verantwortlich" },
          { key: "kontrolle", type: "checkbox", label: "Kontrolle durchgeführt" },
        ],
      },
      active: true,
    },
    update: {},
  });
}

main()
  .then(() => console.log("✅ Seed fertig!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
