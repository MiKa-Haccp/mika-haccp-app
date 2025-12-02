// src/app/api/doku/metzgerei/[year]/months/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ year: string }> },
) {
  const { year } = await ctx.params; // Next 16: params ist ein Promise
  const parsedYear = Number(year);

  if (!Number.isFinite(parsedYear)) {
    return NextResponse.json(
      { error: "Invalid year" },
      { status: 400 },
    );
  }

  try {
    const instances = await prisma.formInstance.findMany({
      // Wieder: KEIN tenantId / marketId Filter, um alles zu sehen,
      // was in diesem Jahr existiert
      where: {
        year: parsedYear,
      },
      include: {
        definition: {
          select: {
            id: true,
            label: true, // dein Schema-Feld heißt "label", nicht "name"
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // periodRef z.B. "2025-11" -> Monat 11
    const byMonth: Record<
      number,
      {
        id: string;
        definitionId: string;
        definitionName: string;
        status: "open" | "completed";
      }[]
    > = {};

    for (const inst of instances) {
      let month = 0;
      const match = /^(\d{4})-(\d{2})/.exec(inst.periodRef);
      if (match) {
        month = Number(match[2]);
      }

      if (!byMonth[month]) {
        byMonth[month] = [];
      }

      byMonth[month].push({
        id: inst.id,
        definitionId: inst.formDefinitionId,
        definitionName: inst.definition?.label ?? "Unbenanntes Formular",
        status: inst.status === "completed" ? "completed" : "open",
      });
    }

    const months = Object.entries(byMonth)
      .map(([m, instances]) => ({
        month: Number(m),
        instances,
      }))
      .sort((a, b) => a.month - b.month);

    return NextResponse.json({
      year: parsedYear,
      months,
    });
  } catch (error) {
    console.error("GET /api/doku/metzgerei/[year]/months error", error);
    return NextResponse.json(
      { error: "Failed to load months" },
      { status: 500 },
    );
  }
}
