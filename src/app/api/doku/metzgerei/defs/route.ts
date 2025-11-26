// src/app/api/doku/metzgerei/defs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  try {
    const defs = await prisma.formDefinition.findMany({
      where: {
        categoryKey: "metzgerei",
        active: true,
        tenantId: { in: [TENANT_ID, "default"] }, // <— WICHTIG
      },
      select: { id: true, label: true, sectionKey: true, period: true, marketId: true },
      orderBy: [{ sectionKey: "asc" }, { label: "asc" }],
    });

    const items = defs.map((d) => ({
      id: d.id,
      label: d.label,
      slug: d.sectionKey?.trim() ? d.sectionKey : slugify(d.label),
      period: d.period,
      marketId: d.marketId,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error("[/api/doku/metzgerei/defs] error:", e);
    return NextResponse.json({ ok: false, error: "Serverfehler" }, { status: 500 });
  }
}
