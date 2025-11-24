import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

// GET /api/dokumentation/forms?category=metzgerei&marketId=<id|''|'null'>
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "metzgerei").trim();
    const marketId = normalizeMarketId(searchParams.get("marketId"));

    // Zwei Queries (robust, ohne NULL-Equals), dann mergen:
    const globalsPromise = prisma.formDefinition.findMany({
      where: { active: true, category: category, marketId: { equals: null } },
      orderBy: [{ label: "asc" }],
    });

    const marketPromise = marketId
      ? prisma.formDefinition.findMany({
          where: { active: true, categoryKey: category, marketId },
          orderBy: [{ label: "asc" }],
        })
      : Promise.resolve([]);

    const [globals, market] = await Promise.all([globalsPromise, marketPromise]);
    const items = marketId ? [...globals, ...market] : globals;

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
