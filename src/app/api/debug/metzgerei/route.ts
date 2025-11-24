// src/app/api/debug/metzgerei/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  const defWhere =
    marketId
      ? { active: true, categoryKey: "metzgerei", OR: [{ marketId: null }, { marketId }] }
      : { active: true, categoryKey: "metzgerei", marketId: null };

  const instWhere =
    marketId
      ? { definition: { active: true, categoryKey: "metzgerei" }, OR: [{ marketId }, { marketId: null }] }
      : { definition: { active: true, categoryKey: "metzgerei" }, marketId: null };

  return NextResponse.json({ ok: true, marketId, defWhere, instWhere });
}
