// src/app/api/metzgerei/instances/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const TENANT_ID = "default";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inst = await prisma.formInstance.findFirst({
      where: { tenantId: TENANT_ID, id },
      include: { definition: true, entries: { orderBy: { date: "desc" } } },
    });
    if (!inst) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

    return NextResponse.json(inst, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
