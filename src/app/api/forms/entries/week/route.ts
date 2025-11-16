import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const definitionId = url.searchParams.get("definitionId");
    const marketId = url.searchParams.get("marketId");
    const weekRef = url.searchParams.get("weekRef"); // z.B. 2025-W46

    if (!definitionId || !marketId || !weekRef) {
      return NextResponse.json(
        { ok: false, error: "Missing definitionId / marketId / weekRef" },
        { status: 400 }
      );
    }

    // passende FormInstance zur Woche finden
    const inst = await prisma.formInstance.findFirst({
      where: {
        tenantId: TENANT,
        marketId,
        formDefinitionId: definitionId,
        periodRef: weekRef,
      },
      select: { id: true },
    });

    if (!inst) {
      // keine Einträge für diese Woche
      return NextResponse.json({ ok: true, entries: [] });
    }

    const rows = await prisma.formEntry.findMany({
      where: { formInstanceId: inst.id },
      orderBy: { date: "asc" },
    });

    const entries = rows.map((e) => ({
      id: e.id,
      date: e.date.toISOString().slice(0, 10), // YYYY-MM-DD
      completedBy: e.completedBy,
      signatureType: e.signatureType,
      signatureMeta: e.signatureMeta,
      data: e.dataJson,
    }));

    return NextResponse.json({ ok: true, entries });
  } catch (err) {
    console.error("forms.entries.week error", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
