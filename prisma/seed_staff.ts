// prisma/seed_staff.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedStaff = {
  tenantId: string;
  marketId?: string;   // optional, kein null nötig
  initials: string;
  pin: string;
  username: string;
};

const staff: SeedStaff[] = [
  { tenantId: "default", initials: "MD", pin: "1234", username: "md" },
  { tenantId: "default", initials: "AB", pin: "2345", username: "ab" },
];

async function main() {
  for (const s of staff) {
    const pinHash = await bcrypt.hash(s.pin, 10);

    await prisma.staffProfile.upsert({
      // username ist @unique → perfekt als Schlüssel
      where: {
        username: s.username,
      },
      update: {
        tenantId: s.tenantId,
        initials: s.initials,
        ...(s.marketId ? { marketId: s.marketId } : {}), // nur setzen, wenn vorhanden
        pinHash,
        active: true,
      },
      create: {
        tenantId: s.tenantId,
        ...(s.marketId ? { marketId: s.marketId } : {}),
        username: s.username,
        initials: s.initials,
        pinHash,
        active: true,
      },
    });
  }
}

main()
  .then(async () => {
    console.log("✅ Staff-Seed fertig");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
