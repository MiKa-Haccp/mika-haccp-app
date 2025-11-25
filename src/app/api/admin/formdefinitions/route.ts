// src/app/api/admin/formdefinitions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

// Hilfsfunktion: Standard-Schema anhand des Typs
function schemaFromType(type: string) {
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
    id,
    label,
    sectionKey,
    period,
    type,
    active = true,
    marketId = null,
    categoryKey = "metzgerei",
    schemaJson,
  } = body ?? {};

  if (!id || !label || !sectionKey) {
    return NextResponse.json(
      { error: "id, label und sectionKey sind erforderlich." },
      { status: 400 }
    );
  }

  try {
    // Rohschema: entweder aus Body oder aus Typ ableiten
    const rawSchema =
      (schemaJson ?? schemaFromType(String(type ?? ""))) as
        | Prisma.InputJsonValue
        | null;

    // Typ **Prisma.NullTypes.JsonNull** für die Annotation verwenden,
    // Wert **Prisma.JsonNull** zum Setzen eines echten JSON-Nulls
    const schema: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull =
      rawSchema === null ? Prisma.JsonNull : rawSchema;

    const created = await prisma.formDefinition.create({
      data: {
        tenantId: TENANT_ID,
        id,
        categoryKey,
        sectionKey,
        label,
        period: period ?? "none",
        schemaJson: schema,
        active: Boolean(active),
        marketId: marketId ?? null, // null = global
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
