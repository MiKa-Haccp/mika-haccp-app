import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

const TENANT = "default"; // Falls dein Tenant "T1" ist, hier anpassen.

export async function POST(req: Request) {
  try {
    const { initials, newPin, marketId } = await req.json();

    if (!initials || !newPin) {
      return NextResponse.json(
        { ok: false, error: "Initialen + neuer PIN nötig" },
        { status: 400 }
      );
    }

    const pinHash = await bcrypt.hash(newPin, 10);

    // Markt-Filter korrekt aufbauen (equals: null verwenden!)
    const whereMarket: Prisma.StaffProfileWhereInput = marketId
      ? {
          OR: [
            { marketId: { equals: marketId } },
            { marketId: { equals: null } },
          ],
        }
      : { marketId: { equals: null } };

    const where: Prisma.StaffProfileWhereInput = {
      tenantId: TENANT,
      initials,
      ...whereMarket,
    };

    const result = await prisma.staffProfile.updateMany({
      where,
      data: { pinHash },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Mitarbeiter nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, updated: result.count });
  } catch (e) {
    console.error("staff.reset-pin error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
