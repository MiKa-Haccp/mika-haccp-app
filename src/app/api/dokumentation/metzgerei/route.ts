// src/app/api/dokumentation/metzgerei/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const TENANT_ID = "default";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

// GET /api/dokumentation/metzgerei?slug=we-baum&marketId=<...>
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "";
    const marketId = normalizeMarketId(searchParams.get("marketId"));

    const defs = await prisma.formDefinition.findMany({
      where: {
        tenantId: TENANT_ID,
        active: true,
        categoryKey: "metzgerei",
        sectionKey: slug,
      },
    });
    if (!defs.length) return NextResponse.json({ items: [] }, { status: 200 });

    // Wenn Markt gewählt: zuerst Markt-Definition, sonst globale
    const def = defs.find(d => d.marketId === marketId) ?? defs.find(d => d.marketId == null) ?? defs[0];

    // Instanzen sauber filtern
    const where: any = {
      tenantId: TENANT_ID,
      formDefinitionId: def.id,
    };
    if (marketId) where.marketId = marketId;
    else where.marketId = null;

    const items = await prisma.formInstance.findMany({
      where,
      include: { definition: true, entries: true },
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({ items, definition: def }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
