import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageSections } from "@/lib/acl";
import { Prisma } from "@prisma/client"; // für Fehlercodes

const TENANT = "T1";

// Dev: Principal aus Header lesen (später echte Auth)
function getPrincipal(req: Request) {
  const h = req.headers.get("x-dev-user");
  return h || "anonymous";
}

/** GET /api/doku/sections?tenantId=T1&marketId=... */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") ?? TENANT;
  const marketId = searchParams.get("marketId");

  let where: any = { tenantId, active: true };

  if (marketId) {
    // global + exakt dieser Markt
    where.OR = [{ marketId }, { marketId: null }];
  } else {
    // kein Markt -> nur globale
    where.marketId = null;
  }

  const sections = await prisma.dokuSection.findMany({
    where,
    orderBy: [{ order: "asc" }, { label: "asc" }],
    select: { id: true, slug: true, label: true, marketId: true, order: true, active: true },
  });

  return NextResponse.json({
    sections: sections.map((s) => ({
      id: s.id,
      slug: s.slug,
      label: s.label,
      status: "open",
      marketId: s.marketId,
      order: s.order,
      active: s.active,
    })),
  });
}

/** POST /api/doku/sections */
export async function POST(req: Request) {
  try {
    const principalId = getPrincipal(req);
    const { tenantId = TENANT, marketId = null, slug, label, order = 0 } = await req.json();

    if (!slug || !label) {
      return NextResponse.json({ error: "Missing fields: slug, label" }, { status: 400 });
    }

    const ok = await canManageSections(principalId, tenantId, marketId);
    if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // WICHTIG: KEIN categoryKey, solange dein Prisma-Modell dieses Feld nicht hat!
    const created = await prisma.dokuSection.create({
      data: { tenantId, marketId, slug, label, order, active: true },
      select: { id: true, slug: true, label: true, marketId: true, order: true, active: true },
    });

    return NextResponse.json({ section: created }, { status: 201 });
  } catch (e: any) {
    // Hilfreiche Fehlerausgabe & sinnvolle Statuscodes
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json({ error: "Duplicate (unique constraint)" }, { status: 409 });
      }
    }
    console.error("POST /api/doku/sections failed:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** PATCH /api/doku/sections  (label/order/active ändern) */
export async function PATCH(req: Request) {
  try {
    const principalId = getPrincipal(req);
    const { id, label, order, active } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const row = await prisma.dokuSection.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

    const ok = await canManageSections(principalId, row.tenantId, row.marketId);
    if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const updated = await prisma.dokuSection.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(active !== undefined ? { active } : {}),
      },
      select: { id: true, slug: true, label: true, marketId: true, order: true, active: true },
    });

    return NextResponse.json({ section: updated });
  } catch (e) {
    console.error("PATCH /api/doku/sections failed:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE /api/doku/sections?id=... */
export async function DELETE(req: Request) {
  try {
    const principalId = getPrincipal(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const row = await prisma.dokuSection.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

    const ok = await canManageSections(principalId, row.tenantId, row.marketId);
    if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    await prisma.dokuSection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/doku/sections failed:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

