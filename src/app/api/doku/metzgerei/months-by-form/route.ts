// src/app/(protected)/api/doku/metzgerei/months-by-form/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const sectionKey = url.searchParams.get("sectionKey");
  const marketId = url.searchParams.get("marketId");
  const yearParam = url.searchParams.get("year");

  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "T1";

  if (!sectionKey) {
    return NextResponse.json(
      { error: "Missing sectionKey" },
      { status: 400 }
    );
  }

  if (!marketId) {
    return NextResponse.json(
      { error: "Missing marketId" },
      { status: 400 }
    );
  }

  const parsedYear = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (!Number.isFinite(parsedYear)) {
    return NextResponse.json(
      { error: "Invalid year" },
      { status: 400 }
    );
  }

  try {
    const instances = await prisma.formInstance.findMany({
      where: {
        tenantId: TENANT_ID,
        marketId,
        year: parsedYear,
        definition: {
          categoryKey: "metzgerei",
          sectionKey,
        },
      },
      include: {
        definition: {
          select: {
            id: true,
            label: true,
            period: true,
            sectionKey: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const label = instances[0]?.definition.label ?? sectionKey;
    const period = instances[0]?.definition.period ?? null;

    function extractMonth(periodRef: string | null): number | null {
      if (!periodRef) return null;
      const m = periodRef.match(/^\d{4}-(\d{2})/);
      if (!m) return null;
      const month = Number(m[1]);
      if (!Number.isFinite(month) || month < 1 || month > 12) return null;
      return month;
    }

    type MonthBucket = {
      month: number;
      instances: {
        id: string;
        status: string;
        periodRef: string;
      }[];
    };

    const buckets = new Map<number, MonthBucket>();

    for (const inst of instances) {
      const month = extractMonth(inst.periodRef);
      if (!month) continue;

      if (!buckets.has(month)) {
        buckets.set(month, { month, instances: [] });
      }
      buckets.get(month)!.instances.push({
        id: inst.id,
        status: inst.status,
        periodRef: inst.periodRef,
      });
    }

    const months = Array.from(buckets.values()).sort(
      (a, b) => a.month - b.month
    );

    return NextResponse.json({
      sectionKey,
      label,
      year: parsedYear,
      period,
      months,
    });
  } catch (error) {
    console.error(
      "GET /api/doku/metzgerei/months-by-form error",
      error
    );
    return NextResponse.json(
      { error: "Failed to load months for section" },
      { status: 500 }
    );
  }
}
