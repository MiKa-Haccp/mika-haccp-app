import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

// GET /api/metzgerei/status?marketId=<id|''|'null'>
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = normalizeMarketId(searchParams.get("marketId"));

    // Nur mit gewähltem Markt Instanzen liefern; global -> leeres Array
    const items = marketId
      ? await prisma.formInstance.findMany({
          where: {
            definition: { active: true, categoryKey: "metzgerei" },
            marketId, // exakt dieser Markt
          },
          select: {
            id: true,
            marketId: true,
            periodRef: true,
            status: true,
            updatedAt: true,
            definition: { select: { id: true, label: true, marketId: true } },
          },
          orderBy: [{ updatedAt: "desc" }],
        })
      : [];

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
