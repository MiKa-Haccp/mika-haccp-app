import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TENANT = "T1";

export async function POST(req: Request) {
  try {
    const { tenantId, marketId, initials, pin } = await req.json();

    const usedTenant = tenantId ?? TENANT;

    if (!initials || !pin) {
      return NextResponse.json(
        { ok: false, error: "Missing initials/pin" },
        { status: 400 }
      );
    }

    const normInitials = String(initials).toUpperCase();

    // Marktbezogen prüfen:
    // - erst im angegebenen Markt
    // - falls nix gefunden: global (marketId = null), z.B. Superadmin
    const staff = await prisma.staffProfile.findFirst({
      where: {
        tenantId: usedTenant,
        initials: normInitials,
        active: true,
        OR: marketId
          ? [
              { marketId },        // Mitarbeiter in diesem Markt
              { marketId: null },  // globaler Superadmin
            ]
          : [{ marketId: null }],  // fallback: nur globale
      },
    });

    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Unknown/Inactive staff" },
        { status: 404 }
      );
    }

    const match = await bcrypt.compare(pin, staff.pinHash);
    if (!match) {
      return NextResponse.json(
        { ok: false, error: "Invalid PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      principalId: `staff:${staff.id}`,
      displayName: staff.initials,
    });
  } catch (e) {
    console.error("pin.verify error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}


