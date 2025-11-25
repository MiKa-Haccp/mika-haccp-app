import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

async function main() {
  await prisma.myMarket.upsert({
    where: { id: "MKT-A" },
    create: { id: "MKT-A", tenantId: TENANT, name: "Markt A" },
    update: {},
  });
  await prisma.myMarket.upsert({
    where: { id: "MKT-B" },
    create: { id: "MKT-B", tenantId: TENANT, name: "Markt B" },
    update: {},
  });
  console.log("✅ markets seeded");
}
main().finally(() => prisma.$disconnect());
