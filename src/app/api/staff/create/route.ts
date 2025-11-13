import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

const TENANT = "T1";

export async function POST(req: Request) {
  try {
    const { marketId, initials, username, pin } = await req.json();

    // 1) Basis-Checks
    if (!initials || !pin) {
      return NextResponse.json(
        { ok: false, error: "Initialen und PIN sind erforderlich." },
        { status: 400 }
      );
    }

    // 2–3 Zeichen erlauben
    const normInitials = String(initials).toUpperCase();
    if (normInitials.length < 2 || normInitials.length > 3) {
      return NextResponse.json(
        { ok: false, error: "Initialen müssen 2–3 Zeichen haben." },
        { status: 400 }
      );
    }

    // 2) Prüfen, ob in DIESEM Markt schon vergeben
    const existing = await prisma.staffProfile.findFirst({
      where: {
        tenantId: TENANT,
        initials: normInitials,
        marketId: marketId ?? null, // gleicher Markt ODER global (bei globalen Staffs)
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: `Die Initialen "${normInitials}" sind in diesem Markt schon vergeben.`,
        },
        { status: 400 }
      );
    }

    // 3) PIN hashen + anlegen
    const pinHash = await bcrypt.hash(pin, 10);

    const staff = await prisma.staffProfile.create({
      data: {
        tenantId: TENANT,
        marketId: marketId ?? null,
        username: username || null,
        pinHash,
        initials: normInitials,
        active: true,
      },
    });

    return NextResponse.json({ ok: true, staff });
  } catch (e: any) {
    console.error("staff.create error", e);

    // Falls doch noch ein P2002 kommt (z.B. Race Condition)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Initialen sind in diesem Markt bereits vergeben. Bitte andere wählen.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Server error beim Anlegen" },
      { status: 500 }
    );
  }
}

