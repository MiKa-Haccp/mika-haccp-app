import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TENANT = "T1";

export async function POST(req: Request) {
  try {
    const { initials, pin } = await req.json();

    if (!initials || !pin) {
      return NextResponse.json({ ok: false, error: "Missing initials/pin" }, { status: 400 });
    }

    const staff = await prisma.staffProfile.findUnique({
      where: { tenantId_initials: { tenantId: TENANT, initials } },
    });

    if (!staff || !staff.active) {
      return NextResponse.json({ ok: false, error: "Unknown/Inactive staff" }, { status: 404 });
    }

    const match = await bcrypt.compare(pin, staff.pinHash);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Invalid PIN" }, { status: 401 });
    }

    // DEV: Wir geben eine simple "principalId" zurück (später echte User-ID)
    return NextResponse.json({
      ok: true,
      principalId: `staff:${staff.initials}`,
      displayName: staff.initials,
    });
  } catch (e) {
    console.error("pin.verify error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
