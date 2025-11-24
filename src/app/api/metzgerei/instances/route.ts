import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ggf. zu "@/lib/db" anpassen

export const dynamic = "force-dynamic";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("marketId") ?? undefined;

  const items = await prisma.formInstance.findMany({
    where: {
      ...(marketId ? { marketId } : {}),
      definition: {
        tenantId: TENANT_ID,
        active: true,
        categoryKey: "metzgerei",
      },
    },
    include: { definition: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, items });
}