import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

async function main() {
  await prisma.rbacAssignment.upsert({
    where: { id: "SEED_SUPERADMIN" },
    create: {
      id: "SEED_SUPERADMIN",
      tenantId: TENANT,
      principalId: "dev-root",
      marketId: null,
      role: "SUPERADMIN",
    },
    update: {},
  });
  console.log("✅ rbac seeded (SUPERADMIN=dev-root)");
}
main().finally(() => prisma.$disconnect());
