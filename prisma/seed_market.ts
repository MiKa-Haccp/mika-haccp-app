import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";
  await prisma.myMarket.upsert({
    where: { id: "MKT-A" },
    update: {},
    create: { id: "MKT-A", tenantId: TENANT_ID, name: "Markt A" },
  });
  await prisma.myMarket.upsert({
    where: { id: "MKT-B" },
    update: {},
    create: { id: "MKT-B", tenantId: TENANT_ID, name: "Markt B" },
  });
  console.log("✅ Seeded MyMarket");
}
main().finally(() => prisma.$disconnect());
