// src/app/api/market/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // oder "@/lib/db"
export const dynamic = "force-dynamic";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET() {
  try {
    const markets = await prisma.myMarket.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ ok: true, markets });
  } catch (e) {
    console.error("GET /api/market error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
