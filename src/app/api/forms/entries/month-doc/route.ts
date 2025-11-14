import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const definitionId = searchParams.get("definitionId");
    const marketId = searchParams.get("marketId");
    const periodRef = searchParams.get("periodRef"); // "YYYY-MM"

    if (!definitionId || !marketId || !periodRef) {
      return NextResponse.json(
        { ok: false, error: "Missing definitionId/marketId/periodRef" },
        { status: 400 }
      );
    }

    // 1) FormInstance (Monats-Container) suchen
    const inst = await prisma.formInstance.findUnique({
      where: {
        tenantId_marketId_formDefinitionId_periodRef: {
          tenantId: TENANT,
          marketId,
          formDefinitionId: definitionId,
          periodRef,
        },
      },
      select: { id: true },
    });

    if (!inst) {
      // Noch keine Einträge = alles leer
      return NextResponse.json({
        ok: true,
        days: {},
      });
    }

    // 2) Alle Tages-Einträge dieses Monats holen
    const entries = await prisma.formEntry.findMany({
      where: { formInstanceId: inst.id },
      orderBy: { date: "asc" },
      select: {
        date: true,
        completedBy: true,
        signatureMeta: true,
        dataJson: true,
      },
    });

    // 3) In ein Map-Objekt pro Tag bringen
    const days: Record<
      string,
      {
        date: string;
        completedBy: string | null;
        initials: string | null;
        data: any;
      }
    > = {};

    for (const e of entries) {
      const iso = e.date.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const dayKey = iso.slice(-2);                  // "01".."31"

      days[dayKey] = {
        date: iso,
        completedBy: e.completedBy,
        initials:
          (e.signatureMeta as any)?.initials ??
          (e.signatureMeta as any)?.signer ??
          null,
        data: e.dataJson,
      };
    }

    return NextResponse.json({ ok: true, days });
  } catch (err) {
    console.error("month-doc error", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
