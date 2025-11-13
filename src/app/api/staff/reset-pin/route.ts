import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TENANT = "T1";

export async function POST(req: Request) {
  try {
    const { initials, newPin, marketId } = await req.json();

    if (!initials || !newPin) {
      return NextResponse.json({ ok: false, error: "Initialen + neuer PIN nötig" }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(newPin, 10);

    const staff = await prisma.staffProfile.updateMany({
      where: {
        tenantId: TENANT,
        initials,
        OR: [{ marketId: null }, { marketId: marketId ?? undefined }],
      },
      data: { pinHash },
    });

    if (staff.count === 0) {
      return NextResponse.json({ ok: false, error: "Mitarbeiter nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("staff.reset-pin error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
