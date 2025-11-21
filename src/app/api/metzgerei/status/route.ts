import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

function startOfDay(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function endOfDay(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999); }
function isoWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
function rangeFor(period: string | null, now = new Date()) {
  const y = now.getFullYear(); const m = now.getMonth();
  switch (period) {
    case "day": return { ref: now.toISOString().slice(0, 10), start: startOfDay(now), end: endOfDay(now) };
    case "week": {
      const { year, week } = isoWeekInfo(now);
      const start = new Date(startOfDay(now)); const day = start.getDay() || 7;
      start.setDate(start.getDate() - (day - 1));
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      return { ref: `${year}-W${String(week).padStart(2,"0")}`, start, end };
    }
    case "month": { const start = new Date(y, m, 1); const end = new Date(y, m+1, 0, 23,59,59,999);
      return { ref: `${y}-${String(m+1).padStart(2,"0")}`, start, end }; }
    case "quarter": { const q = Math.floor(m/3); const start = new Date(y, q*3, 1); const end = new Date(y, q*3+3, 0, 23,59,59,999);
      return { ref: `${y}-Q${q+1}`, start, end }; }
    case "half_year": { const h = m < 6 ? 1 : 2; const start = new Date(y, h===1?0:6, 1); const end = new Date(y, h===1?6:12, 0, 23,59,59,999);
      return { ref: `${y}-H${h}`, start, end }; }
    case "year": { const start = new Date(y, 0, 1); const end = new Date(y, 11, 31, 23,59,59,999); return { ref: String(y), start, end }; }
    default: { return { ref: now.toISOString().slice(0,10), start: startOfDay(now), end: endOfDay(now) }; }
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const marketId = normalizeMarketId(url.searchParams.get("marketId"));

    // sichtbare Definitionen (ohne tenantId-Filter)
    const defsGlobal = await prisma.formDefinition.findMany({
      where: { active: true, categoryKey: "metzgerei", marketId: null },
      orderBy: [{ label: "asc" }],
    });
    const defsMarket = marketId
      ? await prisma.formDefinition.findMany({
          where: { active: true, categoryKey: "metzgerei", marketId },
          orderBy: [{ label: "asc" }],
        })
      : [];
    const defs = marketId ? [...defsGlobal, ...defsMarket] : defsGlobal;

    const now = new Date();
    const items = await Promise.all(
      defs.map(async (d) => {
        const { ref, start, end } = rangeFor(d.period ?? "day", now);
        const instance = await prisma.formInstance.findFirst({
          where: {
            formDefinitionId: d.id,
            marketId: d.marketId ?? marketId ?? null, // Globaldef.: null, Marktdef.: String
            periodRef: ref,
          },
          orderBy: { updatedAt: "desc" },
        });

        let done = false; let updatedAt: Date | null = null;
        if (instance) {
          updatedAt = instance.updatedAt;
          const count = await prisma.formEntry.count({
            where: { formInstanceId: instance.id, date: { gte: start, lte: end } },
          });
          done = count > 0 || instance.status === "done";
        }

        return {
          defId: d.id,
          sectionKey: d.sectionKey,
          label: d.label,
          marketId: d.marketId,
          period: d.period,
          periodRef: ref,
          done,
          updatedAt,
        };
      })
    );

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
