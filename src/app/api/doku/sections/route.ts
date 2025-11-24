import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

// ganz einfache Dev-Auth: Header x-dev-user: dev-root
function isDevSuper(req: Request) {
  const devUser = req.headers.get("x-dev-user");
  return devUser === "dev-root";
}

// GET /api/doku/sections?tenantId=T1&marketId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || TENANT;
    const marketId = searchParams.get("marketId");

    const sections = await prisma.dokuSection.findMany({
      where: {
        tenantId,
        active: true,
        OR: marketId
          ? [
              { marketId }, // markt-spezifisch
              { marketId: { equals: null } }, // global
            ]
          : [{ marketId: { equals: null } }],
      },
      orderBy: [
        { order: "asc" },
        { label: "asc" },
      ],
    });

    return NextResponse.json({ ok: true, sections });
  } catch (e) {
    console.error("doku.sections.list error", e);
    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Laden der Sektionen." },
      { status: 500 }
    );
  }
}

// POST /api/doku/sections  (nur dev-root)
export async function POST(req: Request) {
  try {
    if (!isDevSuper(req)) {
      return NextResponse.json(
        { ok: false, error: "Nicht erlaubt (nur Superadmin)." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const tenantId = body.tenantId || TENANT;
    const marketId: string | null = body.marketId ?? null;
    const slug: string = String(body.slug || "").trim();
    const label: string = String(body.label || "").trim();
    const order: number = Number(body.order ?? 0);

    if (!slug || !label) {
      return NextResponse.json(
        { ok: false, error: "Slug und Bezeichnung sind Pflichtfelder." },
        { status: 400 }
      );
    }

    const sec = await prisma.dokuSection.create({
      data: {
        tenantId,
        marketId,
        slug,
        label,
        order,
        active: true,
      },
    });

    return NextResponse.json({ ok: true, section: sec });
  } catch (e) {
    console.error("doku.sections.create error", e);
    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Anlegen der Sektion." },
      { status: 500 }
    );
  }
}

// PATCH /api/doku/sections   (Update Label/Order/Active)
export async function PATCH(req: Request) {
  try {
    if (!isDevSuper(req)) {
      return NextResponse.json(
        { ok: false, error: "Nicht erlaubt (nur Superadmin)." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const id: string | undefined = body.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID fehlt." },
        { status: 400 }
      );
    }

    const patch: any = {};
    if (body.label !== undefined) patch.label = String(body.label);
    if (body.order !== undefined) patch.order = Number(body.order);
    if (body.active !== undefined) patch.active = !!body.active;

    const sec = await prisma.dokuSection.update({
      where: { id },
      data: patch,
    });

    return NextResponse.json({ ok: true, section: sec });
  } catch (e) {
    console.error("doku.sections.update error", e);
    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Aktualisieren der Sektion." },
      { status: 500 }
    );
  }
}

// DELETE /api/doku/sections?id=...
export async function DELETE(req: Request) {
  try {
    if (!isDevSuper(req)) {
      return NextResponse.json(
        { ok: false, error: "Nicht erlaubt (nur Superadmin)." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID fehlt." },
        { status: 400 }
      );
    }

    await prisma.dokuSection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("doku.sections.delete error", e);
    return NextResponse.json(
      { ok: false, error: "Serverfehler beim Löschen der Sektion." },
      { status: 500 }
    );
  }
}
