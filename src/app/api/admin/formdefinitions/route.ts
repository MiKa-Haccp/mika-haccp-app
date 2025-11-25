// src/app/api/admin/formdefinitions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

// Hilfsfunktion: Standard-Schema anhand des Typs
function schemaFromType(type: string) {
  // Später gerne ausbauen (reinigung, wareneingang, liste, ...)
  if (type === "checklist" || type === "Einfaches Häkchenformular") {
    return {
      type: "checklist",
      items: [{ key: "ok", label: "OK", type: "boolean" }],
    };
  }
  return { type: "custom", items: [] };
}

// GET /api/admin/formdefinitions?category=metzgerei
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "metzgerei";

  const defs = await prisma.formDefinition.findMany({
    where: { tenantId: TENANT_ID, categoryKey: category },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(defs);
}

// POST /api/admin/formdefinitions
// Body: { id, label, sectionKey, period, type, active, marketId?, categoryKey?, schemaJson? }
export async function POST(req: Request) {
  const body = await req.json();
  const {
    id,            // z.B. "FORM_METZ_WE_HUHN"
    label,         // "Metzgerei – WE Hühnerbein"
    sectionKey,    // "we-huhn" (Slug)
    period,        // "none" | "daily" | "weekly" | ...
    type,          // z.B. "Einfaches Häkchenformular"
    active = true,
    marketId = null,              // null = global
    categoryKey = "metzgerei",
    schemaJson,                   // optional: explizites JSON-Schema aus dem Client
  } = body ?? {};

  if (!id || !label || !sectionKey) {
    return NextResponse.json(
      { error: "id, label und sectionKey sind erforderlich." },
      { status: 400 }
    );
  }

  try {
    // Wenn kein schemaJson im Body: aus 'type' ein Default-Schema ableiten
    const rawSchema = schemaJson ?? schemaFromType(String(type ?? ""));

    // Prisma erwartet: InputJsonValue | JsonNull
    const schema: Prisma.InputJsonValue | Prisma.JsonNull =
      rawSchema == null ? Prisma.JsonNull : (rawSchema as Prisma.InputJsonValue);

    const created = await prisma.formDefinition.create({
      data: {
        tenantId: TENANT_ID,
        id,                    // technische ID bewusst manuell
        categoryKey,           // Kategorie, default "metzgerei"
        sectionKey,            // Slug
        label,
        period: period ?? "none",
        schemaJson: schema,    // <- wichtig: korrekt getypt
        active: Boolean(active),
        marketId: marketId ?? null,   // null = global
        lockedForMarkets: false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Fehler beim Anlegen." },
      { status: 500 }
    );
  }
}
