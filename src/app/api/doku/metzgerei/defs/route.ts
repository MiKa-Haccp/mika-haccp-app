// src/app/api/doku/metzgerei/defs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID || "T1";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const marketId = url.searchParams.get("marketId") || undefined;

  // Zeige: alle aktiven Formulare der Kategorie "metzgerei" für den Tenant
  // mit Sichtbarkeit: global ODER aktueller Markt
  const where = {
    tenantId: TENANT,
    active: true,
    categoryKey: "metzgerei",
    OR: [{ marketId: null }, ...(marketId ? [{ marketId }] : [])],
  } as const;

  const rows = await prisma.formDefinition.findMany({
    where,
    orderBy: [{ sectionKey: "asc" }, { label: "asc" }],
    select: { id: true, label: true, sectionKey: true, period: true, marketId: true },
  });

  return NextResponse.json({ ok: true, items: rows });
}
