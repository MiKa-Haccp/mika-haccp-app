import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

export async function GET() {
  try {
    const defs = await prisma.formDefinition.findMany({
      where: {
        tenantId: TENANT,
        categoryKey: "metzgerei",
        active: true,
      },
      orderBy: [
        { sectionKey: "asc" },
        { label: "asc" },
      ],
      select: {
        id: true,
        sectionKey: true,
        label: true,
        period: true,
      },
    });

    return NextResponse.json({ ok: true, items: defs });
  } catch (e) {
    console.error("doku.metzgerei.defs error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" beim Laden der Formulare },
      { status: 500 }
    );
  }
}
