import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TARGET = process.env.NEXT_PUBLIC_TENANT_ID || "T1"; // z.B. T1

async function main() {
  console.log("Ziel-Tenant:", TARGET);
  const before = await prisma.formDefinition.findMany({
    select: { id: true, tenantId: true, categoryKey: true },
    where: { categoryKey: "metzgerei" },
  });
  console.table(before);

  const res = await prisma.formDefinition.updateMany({
    where: { tenantId: "default", categoryKey: "metzgerei" },
    data: { tenantId: TARGET },
  });

  console.log("Update count:", res.count);

  const after = await prisma.formDefinition.findMany({
    select: { id: true, tenantId: true, categoryKey: true },
    where: { categoryKey: "metzgerei" },
  });
  console.table(after);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
