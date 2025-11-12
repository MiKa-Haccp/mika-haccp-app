import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const T1 = "T1";

  // Beispiel: Initialen + PIN (im DEV simpel)
  const staff = [
    { initials: "MD", pin: "1234" },
    { initials: "AB", pin: "1111" },
    { initials: "XY", pin: "0000" },
  ];

  for (const s of staff) {
    const pinHash = await bcrypt.hash(s.pin, 10);
    await prisma.staffProfile.upsert({
      where: { tenantId_initials: { tenantId: T1, initials: s.initials } },
      update: { pinHash, active: true },
      create: {
        tenantId: T1,
        initials: s.initials,
        pinHash,
        active: true,
      },
    });
  }

  console.log("✅ StaffProfile DEV-Seed ok");
}

main().finally(() => prisma.$disconnect());

