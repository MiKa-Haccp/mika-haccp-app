import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const TENANT = process.env.TENANT_ID ?? "default";

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

    // passende Definition(en) zu diesem Slug
    const defsGlobal = await prisma.formDefinition.findMany({
      where: { tenantId: TENANT, active: true, categoryKey: "metzgerei", sectionKey: slug, marketId: null },
      orderBy: [{ label: "asc" }],
    });
    const defsMarket = marketId
      ? await prisma.formDefinition.findMany({
          where: { tenantId: TENANT, active: true, categoryKey: "metzgerei", sectionKey: slug, marketId },
          orderBy: [{ label: "asc" }],
        })
      : [];

    // Instanzen (global + ggf. markt-spezifisch)
    const defIdsGlobal = defsGlobal.map(d => d.id);
    const defIdsMarket = defsMarket.map(d => d.id);

    let instances: any[] = [];
    if (defIdsMarket.length && marketId) {
      const rows = await prisma.formInstance.findMany({
        where: { tenantId: TENANT, formDefinitionId: { in: defIdsMarket }, marketId },
        include: { definition: true },
        orderBy: [{ updatedAt: "desc" }],
      });
      instances = instances.concat(rows);
    }
    if (defIdsGlobal.length) {
      const rows = await prisma.formInstance.findMany({
        where: { tenantId: TENANT, formDefinitionId: { in: defIdsGlobal }, marketId: null },
        include: { definition: true },
        orderBy: [{ updatedAt: "desc" }],
      });
      instances = instances.concat(rows);
    }

    return NextResponse.json({ ok: true, slug, definitions: [...defsGlobal, ...defsMarket], instances }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
