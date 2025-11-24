import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = "default"; // <— passend zu deiner API

async function main() {
  await prisma.rbacAssignment.upsert({
    where: { id: "SEED_SUPERADMIN" },
    create: {
      id: "SEED_SUPERADMIN",
      tenantId: TENANT_ID,
      principalId: "dev-root",
      marketId: null,
      role: Prisma.RbacRole.SUPERADMIN, // <— hier der Trick
    },
    update: {},
  });
  console.log("✅ RBAC-Seed: SUPERADMIN=dev-root");
}

main().finally(() => prisma.$disconnect());
