import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId");
    if (!marketId) {
      return NextResponse.json({ ok: false, error: "Missing marketId" }, { status: 400 });
    }

    const staff = await prisma.staffProfile.findMany({
      where: {
        tenantId: TENANT,
        OR: [
          { marketId: null },
          { marketId },
        ],
      },
      orderBy: { initials: "asc" },
    });

    const ids = staff.map((s) => s.id);
    const assignments = await prisma.rbacAssignment.findMany({
      where: {
        tenantId: TENANT,
        principalId: { in: ids },
        OR: [{ marketId }, { marketId: null }],
      },
    });

    const rows = staff.map((s) => {
      const my = assignments.filter((a) => a.principalId === s.id);
      return {
        id: s.id,
        initials: s.initials,
        username: s.username,
        marketId: s.marketId,
        roles: {
          global: my.filter((a) => a.marketId === null).map((a) => a.role),
          market: my.filter((a) => a.marketId === marketId).map((a) => a.role),
        },
      };
    });

    return NextResponse.json({ ok: true, staff: rows });
  } catch (e) {
    console.error("staff.list error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
