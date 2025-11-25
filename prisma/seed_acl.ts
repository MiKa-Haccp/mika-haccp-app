// @ts-nocheck
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

async function main() {
  await prisma.rbacAssignment.upsert({
    where: { id: "SEED_SUPERADMIN" },
    create: {
      id: "SEED_SUPERADMIN",
      tenantId: TENANT_ID,
      principalId: "dev-root",
      marketId: null,
      role: "SUPERADMIN", // String-Literal statt Enum
    },
    update: {},
  });
  console.log("✅ RBAC-Seed: SUPERADMIN=dev-root");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
