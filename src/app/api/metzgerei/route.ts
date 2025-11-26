import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketId = (searchParams.get("marketId") || "").trim() || null;

  try {
    // 1) Definitions: global immer, plus ggf. markt-spezifisch
    const defWhere = {
      tenantId: TENANT,
      active: true,
      categoryKey: "metzgerei" as const,
      ...(marketId
        ? { OR: [{ marketId }, { marketId: null }] }
        : { marketId: null }),
    };

    const definitions = await prisma.formDefinition.findMany({
      where: defWhere,
      orderBy: { label: "asc" },
      select: {
        id: true,
        label: true,
        sectionKey: true,
        period: true,
        marketId: true,
      },
    });

    // 2) Instances: nur wenn Markt gewählt ist
    const instances = marketId
      ? await prisma.formInstance.findMany({
          where: {
            tenantId: TENANT,
            marketId,
            definition: {
              active: true,
              categoryKey: "metzgerei",
            },
          },
          orderBy: { updatedAt: "desc" },
          include: { definition: { select: { label: true, marketId: true } } },
        })
      : [];

    return NextResponse.json({ definitions, instances });
  } catch (e) {
    console.error("GET /api/metzgerei error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Wir nutzen POST hier nicht mehr (Start läuft über /api/forms/start)
export async function POST() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
