// src/app/api/admin/formdefinitions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

// Minimaler Schemagenerator
function schemaFromType(type: string) {
  if (type === "checklist" || type === "Einfaches Häkchenformular") {
    return { type: "checklist", items: [{ key: "ok", label: "OK", type: "boolean" }] };
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
// Body: { id, label, sectionKey, period, type, active, marketId?, categoryKey? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      label,
      sectionKey,
      period = "none",
      type = "custom",
      active = true,
      marketId = null as string | null,
      categoryKey = "metzgerei",
      schema, // optional: falls du ein fertiges JSON mitsendest
    } = body ?? {};

    if (!id || !label || !sectionKey) {
      return NextResponse.json(
        { error: "id, label und sectionKey sind erforderlich." },
        { status: 400 }
      );
    }

    const schemaJson = (schema ?? schemaFromType(type)) as Prisma.InputJsonValue;

    // FormDefinition upsert by ID (technische ID kommt von dir)
    const def = await prisma.formDefinition.upsert({
      where: { id },
      update: {
        tenantId: TENANT_ID,
        categoryKey,
        sectionKey,
        label,
        period,
        schemaJson,
        active: !!active,
        marketId: marketId ?? null,
      },
      create: {
        id,
        tenantId: TENANT_ID,
        categoryKey,
        sectionKey,
        label,
        period,
        schemaJson,
        active: !!active,
        marketId: marketId ?? null,
      },
    });

    // Doku-Section automatisch anlegen/aktivieren
    if (sectionKey) {
      if (marketId) {
        // Markt-spezifisch: Compound-Unique upsert ist ok (kein null)
        await prisma.dokuSection.upsert({
          where: {
            tenantId_marketId_slug: {
              tenantId: TENANT_ID,
              marketId,
              slug: sectionKey,
            },
          },
          update: { label, active: true },
          create: {
            tenantId: TENANT_ID,
            marketId,
            slug: sectionKey,
            label,
            active: true,
            categoryKey: "dokumentation",
            order: 0,
          },
        });
      } else {
        // GLOBAL (marketId = null): kein upsert möglich → findFirst → update/create
        const existing = await prisma.dokuSection.findFirst({
          where: { tenantId: TENANT_ID, slug: sectionKey, marketId: null },
        });
        if (existing) {
          await prisma.dokuSection.update({
            where: { id: existing.id },
            data: { label, active: true },
          });
        } else {
          await prisma.dokuSection.create({
            data: {
              tenantId: TENANT_ID,
              marketId: null,
              slug: sectionKey,
              label,
              active: true,
              categoryKey: "dokumentation",
              order: 0,
            },
          });
        }
      }
    }

    return NextResponse.json(def, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fehler beim Anlegen." }, { status: 500 });
  }
}
