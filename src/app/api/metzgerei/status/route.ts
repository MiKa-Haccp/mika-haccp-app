import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

const PERIOD_LABEL: Record<string, string> = {
  day: "täglich",
  week: "wöchentlich",
  month: "monatlich",
  quarter: "vierteljährlich",
  half_year: "halbjährlich",
  year: "jährlich",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("marketId");

  if (!marketId) {
    return NextResponse.json(
      { ok: false, error: "Missing marketId", items: [] },
      { status: 400 }
    );
  }

  try {
    // 1) Alle aktiven Metzgerei-Formulare holen (global + marktbezogen, falls du später marketId in FormDefinition benutzen willst)
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
        label: true,
        sectionKey: true,
        period: true,
      },
    });

    // 2) Kacheln bauen
    const items = defs.map((d) => {
      const slug = (d.sectionKey || d.id).trim();
      const periodLabel =
        d.period && PERIOD_LABEL[d.period]
          ? PERIOD_LABEL[d.period]
          : d.period ?? null;

      return {
        slug,          // z.B. "taegl-reinigung"
        label: d.label,
        period: periodLabel,
        ok: false,     // 👉 erstmal immer "offen" (rot), Status-Logik bauen wir später wieder ein
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error("metzgerei.status error", e);
    return NextResponse.json(
      {
        ok: false,
        error: "Serverfehler beim Laden des Metzgerei-Status.",
        items: [],
      },
      { status: 500 }
    );
  }
}
