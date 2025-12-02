// src/app/api/doku/metzgerei/years/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  // marketId vorerst ignorieren, damit alle Instanzen gefunden werden
  // const marketId = url.searchParams.get("marketId") ?? undefined;

  try {
    const years = await prisma.formInstance.findMany({
      // WICHTIG: wir filtern NICHT nach tenantId / marketId,
      // damit auch alte Daten (default / T1 / andere Märkte) gefunden werden
      select: {
        year: true,
      },
      distinct: ["year"],
      orderBy: {
        year: "desc",
      },
    });

    return NextResponse.json({
      years: years.map((y) => y.year).filter((y) => y != null),
    });
  } catch (error) {
    console.error("GET /api/doku/metzgerei/years error", error);
    return NextResponse.json(
      { error: "Failed to load documentation years" },
      { status: 500 },
    );
  }
}
