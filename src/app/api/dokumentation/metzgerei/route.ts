import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function normalizeMarketId(raw: string | null): string | null {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "" || v === "null" || v === "undefined") return null;
  return raw;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const marketId = normalizeMarketId(url.searchParams.get("marketId"));
    if (!slug) return NextResponse.json({ ok: false, error: "slug fehlt" }, { status: 400 });

    // Definitionen (global + ggf. Markt) -- KEIN tenantId-Filter
    const defsGlobal = await prisma.formDefinition.findMany({
      where: { active: true, categoryKey: "metzgerei", sectionKey: slug, marketId: null },
      orderBy: [{ label: "asc" }],
    });
    const defsMarket = marketId
      ? await prisma.formDefinition.findMany({
          where: { active: true, categoryKey: "metzgerei", sectionKey: slug, marketId },
          orderBy: [{ label: "asc" }],
        })
      : [];

    const defIdsGlobal = defsGlobal.map(d => d.id);
    const defIdsMarket = defsMarket.map(d => d.id);

    // WICHTIG: nie Filter-Objekt bei null, sondern Wertgleichheit
    const whereGlobal: Prisma.FormInstanceWhereInput =
      defIdsGlobal.length
        ? { formDefinitionId: { in: defIdsGlobal }, marketId: null }
        : { id: "__none__" as any }; // leer

    const whereMarket: Prisma.FormInstanceWhereInput | null =
      marketId && defIdsMarket.length
        ? { formDefinitionId: { in: defIdsMarket }, marketId }
        : null;

    const [instG, instM] = await Promise.all([
      defIdsGlobal.length
        ? prisma.formInstance.findMany({
            where: whereGlobal,
            include: { definition: true },
            orderBy: [{ updatedAt: "desc" }],
          })
        : Promise.resolve([] as any[]),
      whereMarket
        ? prisma.formInstance.findMany({
            where: whereMarket,
            include: { definition: true },
            orderBy: [{ updatedAt: "desc" }],
          })
        : Promise.resolve([] as any[]),
    ]);

    const instances = [...instM, ...instG];
    return NextResponse.json(
      { ok: true, slug, definitions: [...defsGlobal, ...defsMarket], instances },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
