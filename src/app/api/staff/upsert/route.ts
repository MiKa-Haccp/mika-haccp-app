// src/app/api/staff/upsert/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tenantId = String(body.tenantId ?? "").trim();
    const initialsRaw = String(body.initials ?? "").trim();
    const username = body.username ? String(body.username).trim() : undefined;
    const active: boolean = body.active ?? true;

    // marketId darf null sein -> explizit auf null normalisieren
    const marketId: string | null =
      body.marketId === undefined || body.marketId === null || String(body.marketId).trim() === ""
        ? null
        : String(body.marketId);

    const pin = body.pin ?? undefined;

    if (!tenantId || !initialsRaw) {
      return NextResponse.json(
        { ok: false, error: "tenantId und initials erforderlich" },
        { status: 400 }
      );
    }

    const initials = initialsRaw.toUpperCase();

    // Nur hashen, wenn ein PIN übergeben wurde
    const pinHash = pin !== undefined ? await bcrypt.hash(String(pin), 10) : undefined;

    // --- Manuelles "Upsert": erst suchen, dann update/create
    const existing = await prisma.staffProfile.findFirst({
      where: { tenantId, marketId, initials },
      select: { id: true },
    });

    let staff;
    if (existing) {
      staff = await prisma.staffProfile.update({
        where: { id: existing.id },
        data: {
          ...(username ? { username } : {}),
          ...(pinHash ? { pinHash } : {}),
          active,
          marketId, // ggf. Markt-Zuordnung anpassen
        },
        select: { id: true, initials: true, username: true, marketId: true, active: true },
      });
    } else {
      staff = await prisma.staffProfile.create({
        data: {
          tenantId,
          marketId,
          initials,
          username: username ?? initials,
          pinHash: pinHash ?? (await bcrypt.hash("0000", 10)), // Fallback-PIN
          active,
        },
        select: { id: true, initials: true, username: true, marketId: true, active: true },
      });
    }

    return NextResponse.json({ ok: true, staff });
  } catch (e) {
    console.error("POST /api/staff/upsert error:", e);
    return NextResponse.json({ ok: false, error: "Serverfehler" }, { status: 500 });
  }
}
