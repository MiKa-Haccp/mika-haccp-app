// scripts/migrate_form_instances_to_market.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Deine Standardmarkt-ID (die du schon verwendet hast)
  const STANDARD_MARKET_ID = "63a27cad-4c8c-4349-ae51-fbe0f4329d0d";

  const result = await prisma.formInstance.updateMany({
    where: {
      // alle alten Instanzen ohne Markt, egal welcher tenantId
      marketId: null,
    },
    data: {
      marketId: STANDARD_MARKET_ID,
      tenantId: "T1", // alles auf den Tenant umziehen, den die App benutzt
    },
  });

  console.log(`✅ ${result.count} FormInstances auf Standardmarkt + T1 gemappt.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
