// src/app/api/doku/metzgerei/forms-by-market/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId") || undefined;

    const whereClause: any = {
      tenantId: TENANT,
      definition: {
        tenantId: TENANT,
        categoryKey: "metzgerei",
        active: true,
      },
    };

    if (marketId) {
      whereClause.marketId = marketId;
    }

    // Alle Instanzen (optional gefiltert auf Markt)
    const instances = await prisma.formInstance.findMany({
      where: whereClause,
      include: {
        definition: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const byDef = new Map<
      string,
      {
        id: string;
        label: string;
        period: string;
        marketId: string | null;
        hasInstances: boolean;
      }
    >();

    for (const inst of instances) {
      const d = inst.definition;
      if (!byDef.has(d.id)) {
        byDef.set(d.id, {
          id: d.id,
          label: d.label,
          period: d.period,
          marketId: d.marketId,
          hasInstances: true,
        });
      }
    }

    const forms = Array.from(byDef.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "de")
    );

    return NextResponse.json({ forms });
  } catch (error: any) {
    console.error(
      "GET /api/doku/metzgerei/forms-by-market error",
      error?.message ?? error
    );
    return NextResponse.json(
      { error: "Failed to load metzgerei documentation forms" },
      { status: 500 }
    );
  }
}
