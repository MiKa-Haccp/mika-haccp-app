import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

// GET  /api/admin/forms/metzgerei
// -> Liste aller FormDefinitionen für categoryKey="metzgerei"
export async function GET() {
  try {
    const defs = await prisma.formDefinition.findMany({
      where: {
        tenantId: TENANT,
        categoryKey: "metzgerei",
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
        active: true,
      },
    });

    return NextResponse.json({ ok: true, items: defs });
  } catch (e) {
    console.error("admin.forms.metzgerei.list error", e);
    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Laden der Formulare." },
      { status: 500 }
    );
  }
}

// POST /api/admin/forms/metzgerei
// Body:
// {
//   id: "FORM_METZ_WE_HUHN",
//   label: "Metzgerei – WE Hühnerbein",
//   sectionKey: "we-huhn",
//   period: "month" | "week" | "quarter" | "half_year" | "year" | null,
//   active: true
// }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawId: string | undefined = body.id;
    const rawLabel: string | undefined = body.label;
    const rawSectionKey: string | undefined = body.sectionKey;
    const rawPeriod: string | null | undefined = body.period ?? null;
    const rawActive: boolean | undefined = body.active;

    if (!rawId || !rawLabel || !rawSectionKey) {
      return NextResponse.json(
        { ok: false, error: "ID, Name und Slug (sectionKey) sind Pflichtfelder." },
        { status: 400 }
      );
    }

    const id = String(rawId).trim();
    const label = String(rawLabel).trim();
    const sectionKey = String(rawSectionKey).trim();

    if (!id || !label || !sectionKey) {
      return NextResponse.json(
        { ok: false, error: "ID, Name und Slug dürfen nicht leer sein." },
        { status: 400 }
      );
    }

    // ganz einfache Prüfung: keine Leerzeichen in ID/Slug
    if (id.includes(" ") || sectionKey.includes(" ")) {
      return NextResponse.json(
        { ok: false, error: "ID und Slug dürfen keine Leerzeichen enthalten." },
        { status: 400 }
      );
    }

    const period = rawPeriod ? String(rawPeriod) : null;
    const active = rawActive ?? true;

    const def = await prisma.formDefinition.upsert({
      where: { id },
      update: {
        label,
        sectionKey,
        period,
        active,
      },
      create: {
        id,
        tenantId: TENANT,
        categoryKey: "metzgerei",
        sectionKey,
        label,
        period,
        schemaJson: {}, // später mit echtem Formular-Schema füllen
        active,
      },
    });

    return NextResponse.json({ ok: true, def });
  } catch (e) {
    console.error("admin.forms.metzgerei.upsert error", e);
    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Speichern." },
      { status: 500 }
    );
  }
}
