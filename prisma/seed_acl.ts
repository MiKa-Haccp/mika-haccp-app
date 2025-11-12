import "dotenv/config";
import { PrismaClient, RbacRole } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.rbacAssignment.upsert({
    where: { id: "SEED_SUPERADMIN" },
    create: {
      id: "SEED_SUPERADMIN",
      tenantId: "T1",
      principalId: "dev-root",
      marketId: null,
      role: RbacRole.SUPERADMIN,
    },
    update: {},
  });
  console.log("✅ RBAC-Seed: SUPERADMIN=dev-root");
}
main().finally(() => prisma.$disconnect());
