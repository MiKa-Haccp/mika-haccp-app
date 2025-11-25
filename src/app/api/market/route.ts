import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET() {
  const client = prisma as any; // Typ-Sicherheitsgurt, bis Prisma-Client neu generiert ist

  if (!client.myMarket) {
    // Fallback, bis der Client myMarket enthält
    const markets = [
      { id: "M1", name: "Muster-Markt 1" },
      { id: "M2", name: "Muster-Markt 2" },
    ];
    return NextResponse.json({ ok: true, tenantId: TENANT_ID, markets });
  }

  const markets = await client.myMarket.findMany({
    where: { tenantId: TENANT_ID },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ ok: true, tenantId: TENANT_ID, markets });
}
