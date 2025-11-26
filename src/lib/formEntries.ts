// src/lib/formEntries.ts
import { prisma } from "@/lib/db"; // falls dein Client unter "@/lib/prisma" liegt: anpassen
import bcrypt from "bcryptjs";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function upsertEntryWithPin(args: {
  instanceId: string;
  date: string;           // ISO
  data?: any;             // beliebige Formdaten
  initials: string;
  pin: string;
}) {
  const { instanceId, date, data = {}, initials, pin } = args;

  if (!instanceId || !date || !initials || !pin) {
    throw new Error("instanceId, date, initials, pin erforderlich");
  }

  // Instanz inkl. marketId holen
  const inst = await prisma.formInstance.findFirst({
    where: { tenantId: TENANT_ID, id: instanceId },
    select: { id: true, marketId: true },
  });
  if (!inst) throw new Error("Instanz nicht gefunden");

  // Mitarbeiter anhand TENANT + (Markt oder global null) + Initialen
  const staff = await prisma.staffProfile.findFirst({
    where: {
      tenantId: TENANT_ID,
      marketId: inst.marketId ?? null,
      initials: String(initials).toUpperCase(),
      active: true,
    },
  });
  if (!staff || !staff.pinHash) throw new Error("Unbekannter Mitarbeiter/PIN");

  const ok = await bcrypt.compare(String(pin), staff.pinHash);
  if (!ok) throw new Error("Falscher PIN");

  // Eintrag (Tageszeile) hochziehen/aktualisieren
  const entry = await prisma.formEntry.upsert({
    where: {
      formInstanceId_date: {
        formInstanceId: inst.id,
        date: new Date(date),
      },
    },
    update: {
      dataJson: data,
      completedBy: staff.id,
      signatureType: "PIN",
      signatureMeta: {
        initials: staff.initials,
        username: staff.username,
        at: new Date().toISOString(),
      } as any,
    },
    create: {
      formInstanceId: inst.id,
      date: new Date(date),
      dataJson: data,
      completedBy: staff.id,
      signatureType: "PIN",
      signatureMeta: {
        initials: staff.initials,
        username: staff.username,
        at: new Date().toISOString(),
      } as any,
      tenantId: TENANT_ID,
    },
  });

  return entry;
}
