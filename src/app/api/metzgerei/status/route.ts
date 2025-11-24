import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("marketId");
    const marketId = raw && raw.trim() !== "" ? raw : undefined;
    const tenantId = "default";

    const defsGlobal = await prisma.formDefinition.findMany({
      where: { tenantId, active: true, categoryKey: "metzgerei", marketId: null },
      select: { id: true, sectionKey: true, period: true },
    });

    const defsMarket = marketId
      ? await prisma.formDefinition.findMany({
          where: { tenantId, active: true, categoryKey: "metzgerei", marketId },
          select: { id: true, sectionKey: true, period: true },
        })
      : [];

    return NextResponse.json({
      ok: true,
      marketId: marketId ?? null,
      defs: { global: defsGlobal, market: defsMarket },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
