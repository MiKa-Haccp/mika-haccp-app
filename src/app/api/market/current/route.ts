// src/app/api/market/current/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Einfachster Ansatz:
    // Hole irgendeinen Markt (z.B. den ersten für tenant "default")
    let myMarket = await prisma.myMarket.findFirst({
      where: { tenantId: "default" },
      orderBy: { createdAt: "asc" },
    });

    // Falls noch gar kein Markt existiert, leg einen Default an
    if (!myMarket) {
      myMarket = await prisma.myMarket.create({
        data: {
          tenantId: "default",
          name: "Standardmarkt",
        },
      });
    }

    return NextResponse.json({ myMarket });
  } catch (err) {
    console.error("Fehler in /api/market/current:", err);
    return new NextResponse("Interner Serverfehler", { status: 500 });
  }
}
