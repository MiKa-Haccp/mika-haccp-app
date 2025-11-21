import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Fürs DEV: neuen Datensatz immer mit diesem Tenant anlegen.
// (Später gern durch echten Tenant aus deinem Context ersetzen.)
const NEW_TENANT = process.env.TENANT_ID ?? "default";

function schemaFromTemplate(template?: string | null) {
  switch (template) {
    case "generic_check":
      return { template: "generic_check", type: "checklist", items: [{ key: "ok", label: "OK", type: "boolean" }] };
    case "cleaning_basic":
      return {
        template: "cleaning_basic",
        type: "checklist",
        items: [
          { key: "floors", label: "Böden gereinigt", type: "boolean" },
          { key: "surfaces", label: "Arbeitsflächen gereinigt", type: "boolean" },
        ],
      };
    case "wareneingang":
      return {
        template: "wareneingang",
        type: "goods_in",
        fields: [
          { key: "supplier", label: "Lieferant", type: "text" },
          { key: "temp", label: "Temperatur (°C)", type: "number" },
          { key: "ok", label: "Unversehrt/OK", type: "boolean" },
        ],
      };
    case "simple_list":
      return { template: "simple_list", type: "list", columns: [{ key: "text", label: "Eintrag", type: "text" }] };
    default:
      return { template: "custom", type: "custom", items: [] };
  }
}

// Alle Metzgerei-Formulare zeigen (ohne tenant-Filter, damit ALTE Datensätze sichtbar bleiben)
export async function GET() {
  try {
    const defs = await prisma.formDefinition.findMany({
      where: { categoryKey: "metzgerei" },
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json({ ok: true, items: defs }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}

// Erstellen + Bearbeiten: UPsert (update wenn vorhanden, create wenn neu)
// Body: { id, label, sectionKey, period, active, template, marketId|null }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      label,
      sectionKey,
      period = "none",
      active = true,
      template = "generic_check",
      marketId = null,
    } = body || {};

    if (!id || !label || !sectionKey) {
      return NextResponse.json({ ok: false, error: "id, label und sectionKey sind erforderlich." }, { status: 400 });
    }

    const schemaJson = schemaFromTemplate(template);

    const saved = await prisma.formDefinition.upsert({
      where: { id }, // existiert? -> update
      update: {
        label,
        sectionKey,
        period,
        active: !!active,
        schemaJson,
        marketId: marketId ?? null, // Scope
        categoryKey: "metzgerei",   // hart für diesen Admin
      },
      create: {
        id,
        tenantId: NEW_TENANT,
        categoryKey: "metzgerei",
        sectionKey,
        label,
        period,
        schemaJson,
        active: !!active,
        marketId: marketId ?? null, // Scope
        lockedForMarkets: false,
      },
    });

    return NextResponse.json({ ok: true, item: saved }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
