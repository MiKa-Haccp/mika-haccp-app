import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tenantId = "T1",
      marketId = "M1",
      definitionId,           // z.B. "DEF_ZUST_MON"
      year,                   // z.B. 2025
      periodRef,              // z.B. "2025-11"
      createdBy = "system",
    } = body;

    if (!definitionId || !year || !periodRef) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const instance = await prisma.formInstance.upsert({
      where: {
        tenantId_marketId_formDefinitionId_periodRef: {
          tenantId,
          marketId,
          formDefinitionId: definitionId,
          periodRef,
        },
      },
      create: {
        tenantId,
        marketId,
        formDefinitionId: definitionId,
        year,
        periodRef,
        status: "open",
        createdBy,
      },
      update: {}, // nichts zu ändern beim zweiten Aufruf
    });

    return NextResponse.json({ instance });
  } catch (e) {
    return new NextResponse("Error creating instance", { status: 500 });
  }
}
