import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }
function isoWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
function startOfMonthRef(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function quarterRef(d = new Date()) { const q = Math.floor(d.getMonth()/3)+1; return `${d.getFullYear()}-Q${q}`; }
function halfYearRef(d = new Date()) { const h = d.getMonth() < 6 ? 1 : 2; return `${d.getFullYear()}-H${h}`; }
function periodRefFrom(period: string | null, now = new Date()) {
  switch (period) {
    case "day": return isoDate(now);
    case "week": { const { year, week } = isoWeekInfo(now); return `${year}-W${String(week).padStart(2,"0")}`; }
    case "month": return startOfMonthRef(now);
    case "quarter": return quarterRef(now);
    case "half_year": return halfYearRef(now);
    case "year": return String(now.getFullYear());
    default: return isoDate(now);
  }
}

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = normalizeMarketId(searchParams.get("marketId"));

    // Definitionen (KEIN tenantId-Filter)
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
    const definitions = marketId ? [...defsGlobal, ...defsMarket] : defsGlobal;

    // Instanzen (KEIN tenantId-Filter), getrennte Abfragen damit niemals equals:null entsteht
    let instances;
    if (marketId) {
      instances = await prisma.formInstance.findMany({
        where: { marketId, definition: { active: true, categoryKey: "metzgerei" } },
        include: { definition: true },
        orderBy: [{ updatedAt: "desc" }],
      });
    } else {
      instances = await prisma.formInstance.findMany({
        where: { marketId: null, definition: { active: true, categoryKey: "metzgerei" } },
        include: { definition: true },
        orderBy: [{ updatedAt: "desc" }],
      });
    }

    return NextResponse.json({ definitions, instances }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Serverfehler" }, { status: 500 });
  }
}

// ---------- POST (idempotent) ----------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { definitionId, marketId } = body || {};
    if (!definitionId) return NextResponse.json({ error: "definitionId fehlt." }, { status: 400 });
    if (!marketId) return NextResponse.json({ error: "Bitte zuerst einen Markt auswählen." }, { status: 400 });

    const def = await prisma.formDefinition.findUnique({ where: { id: String(definitionId) } });
    if (!def || def.categoryKey !== "metzgerei" || !def.active) {
      return NextResponse.json({ error: "Formular-Definition nicht gefunden/aktiv." }, { status: 404 });
    }

    const now = new Date();
    const periodRef = periodRefFrom(def.period ?? "day", now);
    const tenant = def.tenantId ?? "default"; // sicherer Fallback

    const existing = await prisma.formInstance.findFirst({
      where: {
        tenantId: tenant,
        marketId: String(marketId),
        formDefinitionId: def.id,
        periodRef,
      },
      include: { definition: true },
    });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const created = await prisma.formInstance.create({
      data: {
        tenantId: tenant,
        marketId: String(marketId),
        formDefinitionId: def.id,
        year: now.getFullYear(),
        periodRef,
        status: "open",
        createdBy: null,
      },
      include: { definition: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
