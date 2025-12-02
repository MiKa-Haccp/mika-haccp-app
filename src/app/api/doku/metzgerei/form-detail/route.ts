import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

function parseYearMonth(searchParams: URLSearchParams) {
  const now = new Date();
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const year = yearParam ? Number(yearParam) : now.getUTCFullYear();
  const month = monthParam ? Number(monthParam) : now.getUTCMonth() + 1;

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error("Ungültiges Jahr/Monat");
  }
  return { year, month };
}

function buildMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function getDaysInMonth(year: number, month: number): Date[] {
  const { start, end } = buildMonthRange(year, month);
  const days: Date[] = [];
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function buildDefinitionCandidates(raw: string): string[] {
  const set = new Set<string>();
  set.add(raw);

  // einmal decodieren
  try {
    const once = decodeURIComponent(raw);
    set.add(once);

    // wenn immer noch % drin ist, nochmal decodieren
    if (once.includes("%")) {
      try {
        const twice = decodeURIComponent(once);
        set.add(twice);
      } catch {
        // ignorieren
      }
    }
  } catch {
    // roh war kein gültig encodierter String → ignorieren
  }

  return Array.from(set);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawDef = searchParams.get("definitionId");
    const marketId = searchParams.get("marketId") || null;

    if (!rawDef) {
      return NextResponse.json(
        { error: "definitionId erforderlich" },
        { status: 400 }
      );
    }

    const candidates = buildDefinitionCandidates(rawDef);
    const { year, month } = parseYearMonth(searchParams);
    const { start, end } = buildMonthRange(year, month);

    const baseFilter = {
      categoryKey: "metzgerei",
      active: true,
    } as const;

    // 1) Definition suchen – mit Tenant
    const orClausesWithTenant = candidates.flatMap((c) => [
      { id: c },
      { sectionKey: c },
    ]);

    let definition = await prisma.formDefinition.findFirst({
      where: {
        ...baseFilter,
        tenantId: TENANT,
        OR: orClausesWithTenant,
      },
    });

    // 2) Fallback ohne Tenant (alte Datensätze)
    if (!definition) {
      const orClauses = candidates.flatMap((c) => [
        { id: c },
        { sectionKey: c },
      ]);

      definition = await prisma.formDefinition.findFirst({
        where: {
          ...baseFilter,
          OR: orClauses,
        },
      });
    }

    if (!definition) {
      return NextResponse.json(
        { error: "FormDefinition nicht gefunden" },
        { status: 404 }
      );
    }

    // 3) Monats-Einträge holen
    const monthEntries = await prisma.formEntry.findMany({
      where: {
        tenantId: TENANT,
        date: {
          gte: start,
          lt: end,
        },
        instance: {
          formDefinitionId: definition.id,
          tenantId: TENANT,
          ...(marketId ? { marketId } : {}),
        },
      },
      select: {
        id: true,
        date: true,
        dataJson: true,
        instance: {
          select: {
            id: true,
            periodRef: true,
            marketId: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const dayMap = new Map<
      string,
      {
        date: string;
        entryId: string;
        instanceId: string;
        data: any;
      }
    >();

    for (const entry of monthEntries) {
      const iso = entry.date.toISOString().slice(0, 10); // YYYY-MM-DD
      dayMap.set(iso, {
        date: iso,
        entryId: entry.id,
        instanceId: entry.instance.id,
        data: entry.dataJson,
      });
    }

    const days = getDaysInMonth(year, month).map((d) => {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const fromMap = dayMap.get(key);
      return {
        date: key,
        hasEntry: !!fromMap,
        entryId: fromMap?.entryId ?? null,
        instanceId: fromMap?.instanceId ?? null,
        data: fromMap?.data ?? null,
      };
    });

    // 4) Archiv-Monate
    const archiveEntries = await prisma.formEntry.findMany({
      where: {
        tenantId: TENANT,
        instance: {
          formDefinitionId: definition.id,
          tenantId: TENANT,
          ...(marketId ? { marketId } : {}),
        },
      },
      select: { date: true },
      orderBy: { date: "desc" },
    });

    const archiveSet = new Set<string>();
    for (const e of archiveEntries) {
      const d = e.date;
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      archiveSet.add(`${y}-${m}`);
    }

    const archiveMonths = Array.from(archiveSet)
      .map((key) => {
        const [y, m] = key.split("-").map((v) => Number(v));
        return { year: y, month: m };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    // 5) Marktname (optional)
    let marketName: string | null = null;
    if (marketId) {
      const market = await prisma.myMarket.findFirst({
        where: { id: marketId, tenantId: TENANT },
      });
      marketName = market?.name ?? null;
    }

    return NextResponse.json({
      definition: {
        id: definition.id,
        label: definition.label,
        period: definition.period,
        marketId: definition.marketId,
      },
      marketName,
      current: {
        year,
        month,
        days,
      },
      archiveMonths,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Serverfehler" },
      { status: 500 }
    );
  }
}
