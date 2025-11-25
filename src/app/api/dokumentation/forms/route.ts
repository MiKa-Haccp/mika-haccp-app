// src/app/api/dokumentation/forms/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

const norm = (v: unknown) => {
  if (v == null) return null;
  const s = String(v).trim();
  return !s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined" ? null : s;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "metzgerei";
  const marketId = norm(url.searchParams.get("marketId"));

  const baseWhere = {
    tenantId: TENANT_ID,
    active: true,
    categoryKey: category,
  } as const;

  // globale Definitionen (marketId = null)
  const globalsPromise = prisma.formDefinition.findMany({
    where: { ...baseWhere, marketId: { equals: null } },
    orderBy: [{ label: "asc" }],
  });

  // marktbezogene Definitionen nur laden, wenn marketId vorhanden ist
  const marketPromise = marketId
    ? prisma.formDefinition.findMany({
        where: { ...baseWhere, marketId: { equals: marketId as string } },
        orderBy: [{ label: "asc" }],
      })
    : Promise.resolve([]);

  const [globals, marketSpecific] = await Promise.all([globalsPromise, marketPromise]);

  // zusammenführen (ohne Duplikate nach id)
  const definitions = Array.from(new Map([...globals, ...marketSpecific].map(d => [d.id, d])).values());

  return NextResponse.json({ ok: true, marketId, definitions });
}
