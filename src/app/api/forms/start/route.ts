// src/app/api/forms/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

// ISO-Woche berechnen (YYYY-Www)
function isoWeekRef(d = new Date()) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: tmp.getUTCFullYear(), ref: `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}` };
}

function computePeriod(defPeriod?: string) {
  const now = new Date();
  const y = now.getFullYear();
  switch ((defPeriod || "single").toLowerCase()) {
    case "day":
      return { year: y, ref: now.toISOString().slice(0, 10) };      // YYYY-MM-DD
    case "week":
      return isoWeekRef(now);                                        // YYYY-Www
    case "month":
      return { year: y, ref: `${y}-${String(now.getMonth() + 1).padStart(2, "0")}` }; // YYYY-MM
    case "year":
      return { year: y, ref: String(y) };
    default:
      return { year: y, ref: "single" };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const definitionId = String(body?.definitionId || "");
    const marketId: string | null = body?.marketId ?? null;       // null = global
    const forcedPeriodRef: string | undefined = body?.periodRef ? String(body.periodRef) : undefined;

    if (!definitionId) {
      return NextResponse.json({ ok: false, error: "definitionId erforderlich" }, { status: 400 });
    }

    // Definition holen (u.a. um 'period' zu wissen)
    const def = await prisma.formDefinition.findUnique({ where: { id: definitionId } });
    if (!def) {
      return NextResponse.json({ ok: false, error: "Formdefinition nicht gefunden" }, { status: 404 });
    }

    // Zeitraum bestimmen
    const { year, ref } = forcedPeriodRef
      ? { year: new Date().getFullYear(), ref: forcedPeriodRef }
      : computePeriod(def.period);

    // 1) Gibt es die Instanz schon? (einzigartig pro Tenant/Markt/Definition/PeriodRef)
    const existing = await prisma.formInstance.findFirst({
      where: {
        tenantId: TENANT,
        marketId: marketId,                 // Achtung: explizit null für global
        formDefinitionId: def.id,
        periodRef: ref,
      },
      include: { definition: { select: { label: true, marketId: true } } },
    });

    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, item: existing });
    }

    // 2) Neu anlegen – NUR skalare Felder, KEIN nested 'definition'
    const inst = await prisma.formInstance.create({
      data: {
        tenantId: TENANT,
        marketId: marketId,                 // null = global bleibt null
        formDefinitionId: def.id,
        year: Number.isFinite(year) ? year : new Date().getFullYear(),
        periodRef: ref,
        status: "open",
      },
      include: { definition: { select: { label: true, marketId: true } } },
    });

    return NextResponse.json({ ok: true, id: inst.id, item: inst });
  } catch (e: any) {
    console.error("POST /api/forms/start error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
