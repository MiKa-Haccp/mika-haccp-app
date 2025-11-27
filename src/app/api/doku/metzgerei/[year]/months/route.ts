// src/app/api/doku/metzgerei/[year]/months/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, ctx: any) {
  const { year } = await ctx.params; // Next 16: params ist Promise
  const url = new URL(req.url);
  const marketId = url.searchParams.get("marketId") ?? undefined;
  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "T1";

  const parsedYear = parseInt(year, 10);
  if (Number.isNaN(parsedYear)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const instances = await prisma.formInstance.findMany({
      where: {
        tenantId: TENANT_ID,
        year: parsedYear,
        ...(marketId ? { marketId } : {}),
        // category: "METZGEREI",
      },
      include: {
        definition: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { month: "asc" },
        { createdAt: "asc" }, // falls du createdAt hast
      ],
    });

    // Aggregation: month → instances[]
    const monthMap: Record<
      number,
      {
        month: number;
        instances: {
          id: string;
          definitionId: string;
          definitionName: string;
          status: "open" | "completed";
        }[];
      }
    > = {};

    for (const inst of instances) {
      const m = (inst as any).month ?? 0; // falls du month-Feld hast; sonst aus Datum ableiten
      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          instances: [],
        };
      }
      monthMap[m].instances.push({
        id: inst.id,
        definitionId: inst.definition.id,
        definitionName: inst.definition.name,
        status: (inst as any).completedAt ? "completed" : "open",
      });
    }

    const months = Object.values(monthMap).sort((a, b) => a.month - b.month);

    return NextResponse.json({
      year: parsedYear,
      months,
    });
  } catch (error) {
    console.error("GET /api/doku/metzgerei/[year]/months error", error);
    return NextResponse.json(
      { error: "Failed to load documentation months" },
      { status: 500 }
    );
  }
}
