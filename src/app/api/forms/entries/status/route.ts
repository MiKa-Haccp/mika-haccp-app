import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") ?? "T1";
    const marketId = searchParams.get("marketId") ?? "M1";
    const definitionId = searchParams.get("definitionId");
    const periodRef = searchParams.get("periodRef"); // "YYYY-MM"
    const daysInMonth = Number(searchParams.get("days") ?? 30);

    if (!definitionId || !periodRef) {
      return new NextResponse("Missing", { status: 400 });
    }

    const instance = await prisma.formInstance.findFirst({
      where: { tenantId, marketId, formDefinitionId: definitionId, periodRef },
      include: { entries: true },
    });

    // Falls Instanz noch nicht existiert → leerer Status
    if (!instance) {
      return NextResponse.json({ doneDays: [], daysInMonth });
    }

    const doneDays = (instance.entries ?? [])
      .map(e => new Date(e.date).getDate())
      .filter(d => d >= 1 && d <= daysInMonth);

    return NextResponse.json({ doneDays, daysInMonth });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
