import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Passe ggf. tenantId-Filter an, wenn du Tenants getrennt hältst
  const markets = await prisma.market.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(markets);
}
