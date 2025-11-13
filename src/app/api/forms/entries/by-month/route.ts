import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const definitionId = searchParams.get("definitionId")!;
    const marketId = searchParams.get("marketId")!;
    const periodRef = searchParams.get("periodRef")!; // "YYYY-MM"

    if (!definitionId || !marketId || !periodRef) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

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
    if (!inst) return NextResponse.json({ ok: true, entries: [] });

    const entries = await prisma.formEntry.findMany({
      where: { formInstanceId: inst.id },
      orderBy: { date: "asc" },
      select: { date: true, dataJson: true, completedBy: true, signatureMeta: true },
    });

    return NextResponse.json({ ok: true, entries });
  } catch (e) {
    console.error("entries.by-month error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
