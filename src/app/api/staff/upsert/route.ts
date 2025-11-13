import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, marketId = null, initials, username, active = true, pin } = body;

    if (!tenantId || !initials) {
      return NextResponse.json({ ok: false, error: "tenantId und initials erforderlich" }, { status: 400 });
    }

    // Username ist sinnvoll, aber nicht zwingend, wenn du nur über Initialen arbeiten willst
    if (!username) {
      // du kannst hier auch stillschweigend initials als username nehmen
      // return NextResponse.json({ ok: false, error: "username erforderlich" }, { status: 400 });
    }

    const pinHash = pin ? await bcrypt.hash(String(pin), 10) : undefined;

    const staff = await prisma.staffProfile.upsert({
      where: { tenantId_initials: { tenantId, initials: initials.toUpperCase() } },
      update: {
        ...(username ? { username } : {}),
        ...(pinHash ? { pinHash } : {}),
        active,
        marketId, // Marktbindung kann hier gesetzt/umgehängt werden
      },
      create: {
        tenantId,
        marketId,
        initials: initials.toUpperCase(),
        username: username ?? initials.toUpperCase(),
        pinHash: pinHash ?? (await bcrypt.hash("0000", 10)), // Default, falls kein PIN übergeben
        active,
      },
      select: { id: true, initials: true, username: true, marketId: true, active: true },
    });

    return NextResponse.json({ ok: true, staff });
  } catch {
    return NextResponse.json({ ok: false, error: "Serverfehler" }, { status: 500 });
  }
}
