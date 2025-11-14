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

    const inst = await prisma.formInstance.findFirst({
      where: {
        tenantId: TENANT,
        marketId,
        formDefinitionId: definitionId,
        periodRef,
      },
      include: {
        entries: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!inst) {
      return NextResponse.json({
        ok: true,
        days: [],
        entries: [],
      });
    }

    const entries = inst.entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString().slice(0, 10), // YYYY-MM-DD
      completedBy: e.completedBy,
      signatureType: e.signatureType,
      signatureMeta: e.signatureMeta,
      data: e.dataJson,
    }));

    const days = entries.map((e) => new Date(e.date).getDate());

    return NextResponse.json({
      ok: true,
      days,
      entries,
    });
  } catch (e) {
    console.error("entries.month error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

