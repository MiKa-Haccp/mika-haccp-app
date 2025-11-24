import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "default";

const norm = (v: unknown) => {
  if (v == null) return null;
  const s = String(v).trim();
  return !s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined" ? null : s;
  };

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(req.url);
  const marketId = norm(searchParams.get("marketId"));
  const section = params.slug;

  if (!marketId) return NextResponse.json({ error: "marketId erforderlich" }, { status: 400 });

  const defs = await prisma.formDefinition.findMany({
    where: { tenantId: TENANT_ID, active: true, categoryKey: "metzgerei", sectionKey: section },
    orderBy: { createdAt: "desc" },
  });

  if (!defs.length) return NextResponse.json({ ok: true, section, marketId, items: [] });

  const rows = await prisma.formInstance.findMany({
    where: { tenantId: TENANT_ID, marketId: marketId as string, formDefinitionId: { in: defs.map(d => d.id) } },
    include: { definition: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    section,
    marketId,
    items: rows.map(r => ({
      id: r.id,
      updatedAt: r.updatedAt,
      createdAt: r.createdAt,
      periodRef: r.periodRef,
      status: r.status,
      definition: {
        id: r.definition.id,
        label: r.definition.label,
        period: r.definition.period,
        sectionKey: r.definition.sectionKey,
      },
    })),
  });
}
