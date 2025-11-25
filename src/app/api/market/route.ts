// src/app/api/market/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET() {
  const markets = await prisma.myMarket.findMany({
    where: { tenantId: TENANT_ID },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ ok: true, markets });
}
