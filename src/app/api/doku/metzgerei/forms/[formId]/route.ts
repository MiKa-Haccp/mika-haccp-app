// src/app/api/doku/metzgerei/forms/[formId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

function extractMonthFromPeriodRef(periodRef: string | null): number {
  if (!periodRef) return 0;
  const match = periodRef.match(/^\d{4}-(\d{2})/);
  if (!match) return 0;
  const m = Number(match[1]);
  return Number.isNaN(m) ? 0 : m;
}

export async function GET(req: Request, ctx: any) {
  const { formId } = await ctx.params;
  const url = new URL(req.url);
  const marketId = url.searchParams.get("marketId") || undefined;

  try {
    const def = await prisma.formDefinition.findUnique({
      where: { id: formId },
    });

    if (!def || def.tenantId !== TENANT || def.categoryKey !== "metzgerei") {
      return NextResponse.json(
        { error: "Formular nicht gefunden oder unzulässig" },
        { status: 404 }
      );
    }

    const instancesRaw = await prisma.formInstance.findMany({
      where: {
        tenantId: TENANT,
        formDefinitionId: formId,
        ...(marketId ? { marketId } : {}),
      },
      include: {
        entries: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: [
        { year: "desc" },
        { createdAt: "desc" },
      ],
    });

    const instances = instancesRaw
      .map((inst) => {
        const month = extractMonthFromPeriodRef(inst.periodRef);
        if (!inst.year || !month) return null;

        return {
          instanceId: inst.id,
          year: inst.year,
          month,
          status: inst.status,
          entries: inst.entries.map((e: any) => ({
            id: e.id,
            date: e.date,
            data: e.dataJson,
            completedBy: e.completedBy,
            signatureType: e.signatureType,
            signatureMeta: e.signatureMeta,
          })),
        };
      })
      .filter(Boolean) as {
        instanceId: string;
        year: number;
        month: number;
        status: string;
        entries: {
          id: string;
          date: Date;
          data: any;
          completedBy: string | null;
          signatureType: string | null;
          signatureMeta: any | null;
        }[];
      }[];

    // Sortierung: neueste zuerst (Jahr/Monat)
    instances.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return NextResponse.json({
      definition: {
        id: def.id,
        label: def.label,
        period: def.period,
      },
      instances,
    });
  } catch (error: any) {
    console.error(
      "GET /api/doku/metzgerei/forms/[formId] error",
      error?.message ?? error
    );
    return NextResponse.json(
      { error: "Failed to load form documentation" },
      { status: 500 }
    );
  }
}
