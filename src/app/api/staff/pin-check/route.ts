import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { tenantId, marketId, initials, pin } = await req.json();

    if (!tenantId || !initials || !pin) {
      return NextResponse.json({ ok: false, error: "tenantId, initials, pin erforderlich" }, { status: 400 });
    }

    // Marktgebunden: erst Markt-Treffer, sonst globaler Fallback (optional)
    const staff = await prisma.staffProfile.findFirst({
      where: {
        tenantId,
        active: true,
        initials: initials.toUpperCase(),
        OR: [
          { marketId: marketId ?? undefined },
          { marketId: null }, // optional: erlaube globales Personal
        ],
      },
      orderBy: { marketId: "desc" }, // bevorzugt markt-spezifisch
    });

    if (!staff) {
      return NextResponse.json({ ok: false, error: "Person nicht gefunden" }, { status: 404 });
    }

    const ok = await bcrypt.compare(pin, staff.pinHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "PIN falsch" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      staff: { id: staff.id, initials: staff.initials, marketId: staff.marketId },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Serverfehler" }, { status: 500 });
  }
}
