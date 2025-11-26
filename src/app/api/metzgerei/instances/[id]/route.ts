// src/app/api/metzgerei/instances/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // 1) Immer erst die Instanz + Definition holen
  const row = await prisma.formInstance.findUnique({
    where: { id },
    include: {
      definition: {
        select: {
          id: true,
          tenantId: true,
          active: true,
          categoryKey: true,
          sectionKey: true,
          period: true,
          label: true,
          marketId: true,
          schemaJson: true, // <- fürs UI wichtig
        },
      },
    },
  });

  // 2) Not found, wenn es gar nichts gibt
  if (!row || !row.definition) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  // 3) Guards NACH dem Laden (toleranter bzgl. Tenant-Migration)
  const def = row.definition;
  const tenantOk = def.tenantId === TENANT_ID || def.tenantId === "default";
  const catOk = def.categoryKey === "metzgerei";
  const activeOk = !!def.active;

  if (!tenantOk || !catOk || !activeOk) {
    return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, item: row });
}
