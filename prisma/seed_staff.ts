// prisma/seed_staff.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 👇 Vergib JEDEM Eintrag einen eindeutigen username
  const staff = [
    { tenantId: "T1", initials: "MD", pin: "1234", username: "md" },
    { tenantId: "T1", initials: "AB", pin: "2345", username: "ab" },
    // weitere Einträge nach Bedarf …
  ];

  for (const s of staff) {
    const pinHash = await bcrypt.hash(s.pin, 10);

    await prisma.staffProfile.upsert({
      // nutzt dein Composite-Unique @@unique([tenantId, initials])
      where: {
        tenantId_initials: { tenantId: s.tenantId, initials: s.initials },
      },
      update: {
        // du kannst hier bei Bedarf auch username pflegen, falls er sich ändert:
        username: s.username,
        pinHash,
        active: true,
      },
      create: {
        tenantId: s.tenantId,
        marketId: null,           // optional, kann auch weggelassen werden
        username: s.username,     // <-- WAR bisher der fehlende Pflichtwert
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

