import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Hilfsfunktion: Standard-Schema anhand des Typs
function schemaFromType(type: string) {
  // Du kannst das später ausbauen (reinigung, wareneingang, liste, ...)
  if (type === "checklist" || type === "Einfaches Häkchenformular") {
    return {
      type: "checklist",
      items: [
        { key: "ok", label: "OK", type: "boolean" }
      ],
    };
  }
  return { type: "custom", items: [] };
}

// GET /api/admin/formdefinitions?category=metzgerei
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "metzgerei";

  const defs = await prisma.formDefinition.findMany({
    where: { categoryKey: category },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(defs);
}

// POST /api/admin/formdefinitions
// Body: { id, label, sectionKey, period, type, active, marketId? }
export async function POST(req: Request) {
  const body = await req.json();
  const {
    id,           // z.B. "FORM_METZ_WE_HUHN"
    label,        // "Metzgerei – WE Hühnerbein"
    sectionKey,   // "we-huhn" (Slug)
    period,       // z.B. "none" | "daily" | "weekly" | ...
    type,         // z.B. "Einfaches Häkchenformular"
    active = true,
    marketId = null, // null = global
    categoryKey = "metzgerei",
  } = body;

  if (!id || !label || !sectionKey) {
    return NextResponse.json(
      { error: "id, label und sectionKey sind erforderlich." },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.formDefinition.create({
      data: {
        id,              // bewusst manuell, damit deine "technische ID" übernommen wird
        categoryKey,     // <- feste Kategorie "metzgerei"
        sectionKey,      // <- Slug
        label,
        period: period || "none",
        schemaJson: schemaFromType(type),
        active: !!active,
        marketId,             // null = global; ansonsten form nur in diesem Markt sichtbar
        lockedForMarkets: false,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Fehler beim Anlegen." },
      { status: 500 }
    );
  }
}
