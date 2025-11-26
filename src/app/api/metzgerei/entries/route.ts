// src/app/api/metzgerei/entries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

// POST body: { instanceId, date: "YYYY-MM-DD", data: any, initials, pin }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instanceId, date, data, initials, pin } = body ?? {};

    if (!instanceId || !date || data === undefined || !initials || !pin) {
      return NextResponse.json(
        { ok: false, error: "instanceId, date, data, initials, pin erforderlich" },
        { status: 400 }
      );
    }

    // 1) Instanz holen (inkl. Definition). Fallback: Definition nachladen
    const inst = await prisma.formInstance.findUnique({
      where: { id: String(instanceId) },
      include: { definition: true },
    });
    if (!inst) {
      return NextResponse.json({ ok: false, error: "Instanz nicht gefunden" }, { status: 404 });
    }

    // Tenant-Prüfung primär auf der Instanz (die wurde mit deinem TENANT erstellt)
    if (inst.tenantId !== TENANT) {
      return NextResponse.json({ ok: false, error: "Falscher Tenant" }, { status: 403 });
    }

    const def =
      inst.definition ??
      (await prisma.formDefinition.findUnique({
        where: { id: inst.formDefinitionId },
      }));

    // Definition muss existieren, aktiv sein und zur Kategorie "metzgerei" gehören
    if (!def || !def.active || def.categoryKey !== "metzgerei") {
      return NextResponse.json({ ok: false, error: "Formular-Instanz unzulässig" }, { status: 403 });
    }

    // 2) Mitarbeiter prüfen (Initialen + PIN), Scope: gleicher Markt oder global
    const staff = await prisma.staffProfile.findFirst({
      where: {
        tenantId: TENANT,
        active: true,
        initials: String(initials).toUpperCase(),
        OR: inst.marketId
          ? [{ marketId: inst.marketId }, { marketId: null }]
          : [{ marketId: null }],
      },
    });
    if (!staff) {
      return NextResponse.json({ ok: false, error: "Mitarbeiter (Initialen) unbekannt" }, { status: 404 });
    }

    const okPin = await bcrypt.compare(String(pin), staff.pinHash);
    if (!okPin) {
      return NextResponse.json({ ok: false, error: "PIN ungültig" }, { status: 401 });
    }

    // 3) Speichern/Upsert für das Datum
    const entryDate = new Date(`${date}T00:00:00.000Z`);

    const saved = await prisma.formEntry.upsert({
      where: {
        formInstanceId_date: {
          formInstanceId: inst.id,
          date: entryDate,
        },
      },
      update: {
        dataJson: data,
        completedBy: staff.initials,
        signatureType: "pin",
        signatureMeta: { by: staff.initials },
      },
      create: {
        tenantId: TENANT,
        formInstanceId: inst.id,
        date: entryDate,
        dataJson: data,
        completedBy: staff.initials,
        signatureType: "pin",
        signatureMeta: { by: staff.initials },
      },
      select: { id: true, date: true },
    });

    return NextResponse.json({ ok: true, entry: saved });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
