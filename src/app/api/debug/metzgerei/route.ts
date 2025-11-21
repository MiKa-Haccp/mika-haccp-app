import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const marketId = normalizeMarketId(searchParams.get("marketId"));

  const defWhere = marketId
    ? { active: true, categoryKey: "metzgerei", OR: [{ marketId: { equals: null } }, { marketId }] }
    : { active: true, categoryKey: "metzgerei", marketId: { equals: null } };

  const instWhere = marketId
    ? { OR: [{ marketId }, { marketId: { equals: null } }], definition: { active: true, categoryKey: "metzgerei" } }
    : { marketId: { equals: null }, definition: { active: true, categoryKey: "metzgerei" } };

  return NextResponse.json({ ok: true, marketId, defWhere, instWhere }, { status: 200 });
}
