// src/app/api/doku/metzgerei/years/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const marketId = url.searchParams.get("marketId") ?? undefined;
  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "T1";

  try {
    const years = await prisma.formInstance.findMany({
      where: {
        tenantId: TENANT_ID,
        ...(marketId ? { marketId } : {}),
        // falls du eine Kategorie-Spalte hast:
        // category: "METZGEREI",
      },
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
      { status: 500 }
    );
  }
}
