import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

/**
 * GET /api/forms/entries/week?definitionId=FORM_METZ_WOCH_REINIGUNG&marketId=...&periodRef=YYYY-Www
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const definitionId = url.searchParams.get("definitionId");
    const marketId = url.searchParams.get("marketId");
    const periodRef = url.searchParams.get("periodRef"); // z.B. "2025-W46"

    if (!definitionId || !marketId || !periodRef) {
      return NextResponse.json(
        { ok: false, error: "Missing params" },
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
      select: { id: true },
    });

    if (!inst) {
      return NextResponse.json({ ok: true, entries: [] });
    }

    const entries = await prisma.formEntry.findMany({
      where: { formInstanceId: inst.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      ok: true,
      entries: entries.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        completedBy: e.completedBy,
        signatureType: e.signatureType,
        signatureMeta: e.signatureMeta,
        data: e.dataJson,
      })),
    });
  } catch (e) {
    console.error("entries.week error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
