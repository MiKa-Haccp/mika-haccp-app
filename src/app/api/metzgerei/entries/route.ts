import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST { instanceId, dateISO?: "YYYY-MM-DD", data: any, status?: "open"|"done" }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { instanceId, dateISO, data, status } = body || {};
    if (!instanceId) return NextResponse.json({ ok: false, error: "instanceId fehlt" }, { status: 400 });

    const inst = await prisma.formInstance.findUnique({ where: { id: String(instanceId) }, include: { definition: true } });
    if (!inst) return NextResponse.json({ ok: false, error: "Instance nicht gefunden" }, { status: 404 });

    const iso = (dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)) ? dateISO : new Date().toISOString().slice(0,10);
    const date = new Date(`${iso}T00:00:00.000Z`);

    // Speichern/Upsert des Tages-Eintrags
    const saved = await prisma.formEntry.upsert({
      where: { formInstanceId_date: { formInstanceId: inst.id, date } },
      update: { dataJson: data ?? {}, updatedAt: new Date() },
      create: { formInstanceId: inst.id, date, dataJson: data ?? {} },
    });

    // Optional: Instanz-Status aktualisieren
    if (status === "open" || status === "done") {
      await prisma.formInstance.update({
        where: { id: inst.id },
        data: { status, updatedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, entry: saved }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
