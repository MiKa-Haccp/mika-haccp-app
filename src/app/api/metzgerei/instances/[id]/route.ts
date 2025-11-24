// src/app/api/metzgerei/instances/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const row = await prisma.formInstance.findFirst({
    where: {
      id,
      definition: { tenantId: TENANT_ID, active: true, categoryKey: "metzgerei" },
    },
    include: { definition: true },
  });

  if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, item: row });
}
