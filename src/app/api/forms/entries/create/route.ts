import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { tenantId = "T1", marketId = "M1", definitionId, periodRef, dateISO, data } = await req.json();
    if (!definitionId || !periodRef || !dateISO) return new NextResponse("Missing", { status: 400 });

    // Instanz holen
    const inst = await prisma.formInstance.findFirst({
      where: { tenantId, marketId, formDefinitionId: definitionId, periodRef },
    });
    if (!inst) return new NextResponse("Instance not found", { status: 404 });

    // Eintrag upsert (pro Tag einzigartig)
    const entry = await prisma.formEntry.upsert({
      where: { formInstanceId_date: { formInstanceId: inst.id, date: new Date(dateISO) } },
      create: {
        formInstanceId: inst.id,
        date: new Date(dateISO),
        dataJson: data ?? {},
        completedBy: "tester",
        signatureType: null,
      },
      update: { dataJson: data ?? {} },
    });

    return NextResponse.json({ entry });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
