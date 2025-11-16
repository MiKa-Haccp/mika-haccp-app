// src/app/api/metzgerei/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

// aktueller Monat als "YYYY-MM"
function currentPeriodRef() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// Hilfsfunktion: hat dieses Formular im Zeitraum EINEN Eintrag?
async function hasAnyEntry(
  definitionId: string,
  marketId: string,
  periodRef: string
) {
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

    // IDs müssen zu deinen FormDefinitionen passen!
    const DAILY_ID = "FORM_METZ_TAEGL_REINIGUNG";
    const WEEKLY_ID = "FORM_METZ_WOCH_REINIGUNG";         // <- so wie in deinem Formular
    const MONTHLY_ID = "FORM_METZ_MONAT_REINIGUNG";
    const QUARTERLY_ID = "FORM_METZ_VIERTEL_REINIGUNG";
    const HALFYEAR_ID = "FORM_METZ_HALBJ_REINIGUNG";
    const YEARLY_ID = "FORM_METZ_JAHR_REINIGUNG";

    const [
      hasDaily,
      hasWeekly,
      hasMonthly,
      hasQuarterly,
      hasHalfYear,
      hasYearly,
    ] = await Promise.all([
      hasAnyEntry(DAILY_ID, marketId, periodRef),
      hasAnyEntry(WEEKLY_ID, marketId, periodRef),
      hasAnyEntry(MONTHLY_ID, marketId, periodRef),
      hasAnyEntry(QUARTERLY_ID, marketId, periodRef),
      hasAnyEntry(HALFYEAR_ID, marketId, periodRef),
      hasAnyEntry(YEARLY_ID, marketId, periodRef),
    ]);

    return NextResponse.json({
      ok: true,
      daily: hasDaily ? "ok" : "open",
      weekly: hasWeekly ? "ok" : "open",
      monthly: hasMonthly ? "ok" : "open",
      quarterly: hasQuarterly ? "ok" : "open",
      halfYear: hasHalfYear ? "ok" : "open",
      yearly: hasYearly ? "ok" : "open",
    });
  } catch (e) {
    console.error("metzgerei/status error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

