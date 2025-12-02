// src/app/api/doku/metzgerei/forms/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("marketId");

  if (!marketId) {
    return NextResponse.json(
      { error: "marketId is required" },
      { status: 400 }
    );
  }

  try {
    const forms = await prisma.formDefinition.findMany({
      where: {
        categoryKey: "metzgerei",
        active: true,
        // globale + marktspezifische Formulare
        OR: [
          { marketId: null },
          { marketId },
        ],
      },
      select: {
        id: true,
        label: true,
        period: true,
        marketId: true,
        sectionKey: true,
      },
      orderBy: [
        // einfache Sortierung nach Name
        { label: "asc" },
      ],
    });

    console.log("/api/doku/metzgerei/forms", {
      marketId,
      count: forms.length,
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("GET /api/doku/metzgerei/forms error", error);
    return NextResponse.json(
      { error: "Failed to load Metzgerei forms" },
      { status: 500 }
    );
  }
}
