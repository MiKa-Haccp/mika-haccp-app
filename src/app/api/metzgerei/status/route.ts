import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

// Hilfsfunktion: aktueller Monat als "YYYY-MM"
function currentPeriodRef() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// kleine Hilfsfunktion: hat dieses Formular im Monat EINEN Eintrag?
async function hasAnyEntry(definitionId: string, marketId: string, periodRef: string) {
  // FormInstance zum Formular & Monat holen
  const inst = await prisma.formInstance.findFirst({
    where: {
      tenantId: TENANT,
      marketId,
      formDefinitionId: definitionId,
      periodRef,
    },
    select: { id: true },
  });

  if (!inst) return false;

  const count = await prisma.formEntry.count({
    where: { formInstanceId: inst.id },
  });

  return count > 0;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId");
    const periodRef = url.searchParams.get("periodRef") ?? currentPeriodRef();

    if (!marketId) {
      return NextResponse.json(
        { ok: false, error: "Missing marketId" },
        { status: 400 }
      );
    }

    // IDs müssen zu deinen FormDefinitionen passen
    const DAILY_ID = "FORM_METZ_TAEGL_REINIGUNG";
    const WEEKLY_ID = "FORM_METZ_WOECH_REINIGUNG";
    const QUARTERLY_ID = "FORM_METZ_VIERTEL_REINIGUNG";

    const [hasDaily, hasWeekly, hasQuarterly] = await Promise.all([
      hasAnyEntry(DAILY_ID, marketId, periodRef),
      hasAnyEntry(WEEKLY_ID, marketId, periodRef),
      hasAnyEntry(QUARTERLY_ID, marketId, periodRef),
    ]);

    return NextResponse.json({
      ok: true,
      daily: hasDaily ? "ok" : "open",
      weekly: hasWeekly ? "ok" : "open",
      quarterly: hasQuarterly ? "ok" : "open",
    });
  } catch (e) {
    console.error("metzgerei/status error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
