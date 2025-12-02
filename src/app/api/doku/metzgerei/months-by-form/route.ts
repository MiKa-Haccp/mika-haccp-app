// src/app/api/doku/metzgerei/months-by-form/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const marketId = url.searchParams.get("marketId") || undefined;
  const yearParam = url.searchParams.get("year");
  const sectionKey = url.searchParams.get("sectionKey") || undefined;

  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "T1";

  const parsedYear = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (!Number.isFinite(parsedYear)) {
    return NextResponse.json(
      { error: "Invalid year" },
      { status: 400 }
    );
  }

  if (!sectionKey) {
    return NextResponse.json(
      { error: "Missing sectionKey" },
      { status: 400 }
    );
  }

  try {
    // 1) passende FormDefinition finden (Markt-spezifisch hat Vorrang vor global)
    const formDef = await prisma.formDefinition.findFirst({
      where: {
        tenantId: TENANT_ID,
        categoryKey: "metzgerei",
        sectionKey,
        active: true,
        OR: [
          { marketId: null },
          ...(marketId ? [{ marketId }] : []),
        ],
      },
      orderBy: [
        { marketId: "desc" }, // zuerst Markt-spezifisch
        { createdAt: "asc" },
      ],
    });

    if (!formDef) {
      // Kein Formular gefunden – leere Struktur zurückgeben,
      // damit die UI trotzdem das Jahr / die Monate anzeigen kann.
      return NextResponse.json({
        sectionKey,
        label: sectionKey,
        year: parsedYear,
        period: null,
        months: [],
      });
    }

    // 2) Instanzen + Einträge laden
    const instances = await prisma.formInstance.findMany({
      where: {
        tenantId: TENANT_ID,
        formDefinitionId: formDef.id,
        year: parsedYear,
        ...(marketId ? { marketId } : {}),
      },
      include: {
        entries: {
          select: {
            date: true,
            dataJson: true,
            completedBy: true,
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: {
        periodRef: "asc",
      },
    });

    function summarizeEntry(entry: { dataJson: any } | undefined | null) {
      if (!entry) return null;

      const data = entry.dataJson as any;
      const parts: string[] = [];

      // ein paar generische Felder – später können wir das pro Formular-Typ
      if (typeof data.ok === "boolean") {
        parts.push(data.ok ? "Ware in Ordnung" : "Ware beanstandet");
      }
      if (data.temperature != null) {
        parts.push(`Temp: ${data.temperature}°C`);
      }
      if (data.notes) {
        parts.push(String(data.notes));
      }

      return parts.length ? parts.join(" · ") : "Eintrag vorhanden";
    }

    const monthsMap = new Map<
      number,
      { month: number; instances: any[] }
    >();

    for (const inst of instances) {
      const date = inst.periodRef ? new Date(inst.periodRef) : null;
      if (!date || Number.isNaN(date.getTime())) {
        // periodRef ist nicht als Datum parsebar – überspringen
        continue;
      }

      const month = date.getMonth() + 1;
      const monthBlock =
        monthsMap.get(month) ?? { month, instances: [] };

      const lastEntry =
        inst.entries[inst.entries.length - 1] ?? null;

      monthBlock.instances.push({
        id: inst.id,
        periodRef: inst.periodRef,
        status: inst.status === "completed" ? "completed" : "open",
        completedBy: lastEntry?.completedBy ?? null,
        summary: summarizeEntry(lastEntry),
      });

      monthsMap.set(month, monthBlock);
    }

    const months = Array.from(monthsMap.values()).sort(
      (a, b) => a.month - b.month
    );

    return NextResponse.json({
      sectionKey,
      label: formDef.label,
      year: parsedYear,
      period: formDef.period,
      months,
    });
  } catch (error) {
    console.error(
      "GET /api/doku/metzgerei/months-by-form error",
      error
    );
    return NextResponse.json(
      { error: "Failed to load month data" },
      { status: 500 }
    );
  }
}
