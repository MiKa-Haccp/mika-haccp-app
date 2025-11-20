import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const TENANT = "T1";

// GET  /api/admin/forms/metzgerei
// -> Liste aller FormDefinitionen für categoryKey="metzgerei"
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawId: string | undefined = body.id;
    const rawLabel: string | undefined = body.label;
    const rawSectionKey: string | undefined = body.sectionKey;
    const rawPeriod: string | null | undefined = body.period ?? null;
    const rawActive: boolean | undefined = body.active;
    const rawTemplate: string | undefined = body.template;
    const rawMarketId: string | null | undefined = body.marketId ?? null; // 👈 NEU

    // ... deine bisherigen Checks ...

    const period =
      rawPeriod === null || rawPeriod === undefined || rawPeriod === ""
        ? null
        : String(rawPeriod);

    const active = rawActive ?? true;
    const template =
      rawTemplate && typeof rawTemplate === "string"
        ? rawTemplate
        : "generic_check";

    const marketId =
      rawMarketId === null || rawMarketId === undefined || rawMarketId === ""
        ? null
        : String(rawMarketId);

    const def = await prisma.formDefinition.upsert({
      where: { id },
      update: {
        label,
        sectionKey,
        period,
        active,
        marketId,
        schemaJson: { template },
      },
      create: {
        id,
        tenantId: TENANT,
        categoryKey: "metzgerei",
        sectionKey,
        label,
        period,
        marketId,
        schemaJson: { template },
        active,
      },
    });

    return NextResponse.json({ ok: true, def });
  } catch (e: any) {
    console.error("admin.forms.metzgerei.upsert error", e);

    // z.B. Unique-Fehler usw. sauber melden
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { ok: false, error: `Datenbankfehler (${e.code}): ${e.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Speichern." },
      { status: 500 }
    );
  }
}
