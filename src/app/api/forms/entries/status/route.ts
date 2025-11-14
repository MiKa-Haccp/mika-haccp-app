import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

const TENANT = "T1";

function toYMD(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number) {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getMonthBoundsUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  return { start, end };
}

function getWeekBoundsUTC(d: Date) {
  // Montag als Wochenanfang
  const day = d.getUTCDay(); // 0=So, 1=Mo, ...
  const diffToMonday = (day + 6) % 7; // 0 wenn Montag, 6 wenn Sonntag
  const monday = addDaysUTC(startOfDayUTC(d), -diffToMonday);
  const nextMonday = addDaysUTC(monday, 7);
  return { start: monday, end: nextMonday };
}

function getQuarterBoundsUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0..11
  const q = Math.floor(m / 3); // 0..3
  const startMonth = q * 3;
  const start = new Date(Date.UTC(y, startMonth, 1));
  const end = new Date(Date.UTC(y, startMonth + 3, 1));
  return { start, end };
}

function getYearBoundsUTC(d: Date) {
  const y = d.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const end = new Date(Date.UTC(y + 1, 0, 1));
  return { start, end };
}

function getBoundsForFrequency(date: Date, frequency: Frequency) {
  const dayStart = startOfDayUTC(date);
  switch (frequency) {
    case "daily":
      return { start: dayStart, end: addDaysUTC(dayStart, 1) };
    case "weekly":
      return getWeekBoundsUTC(dayStart);
    case "monthly":
      return getMonthBoundsUTC(dayStart);
    case "quarterly":
      return getQuarterBoundsUTC(dayStart);
    case "yearly":
      return getYearBoundsUTC(dayStart);
    default:
      return { start: dayStart, end: addDaysUTC(dayStart, 1) };
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const tenantId = url.searchParams.get("tenantId") ?? TENANT;
    const marketId = url.searchParams.get("marketId");
    const definitionId = url.searchParams.get("definitionId");
    const frequency = (url.searchParams.get("frequency") ?? "daily") as Frequency;
    const dateStr = url.searchParams.get("date");

    if (!marketId || !definitionId) {
      return NextResponse.json(
        { ok: false, error: "Missing marketId/definitionId" },
        { status: 400 }
      );
    }

    const today = dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date();
    if (Number.isNaN(today.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid date" },
        { status: 400 }
      );
    }

    // Unsere FormInstances sind monatlich gruppiert (periodRef = "YYYY-MM")
    const ymd = toYMD(today);
    const periodRef = ymd.slice(0, 7); // "YYYY-MM"

    const instance = await prisma.formInstance.findFirst({
      where: {
        tenantId,
        marketId,
        formDefinitionId: definitionId,
        periodRef,
      },
      select: { id: true },
    });

    if (!instance) {
      // Noch nie in diesem Monat angerührt => "rot"
      return NextResponse.json({ ok: true, done: false });
    }

    const { start, end } = getBoundsForFrequency(today, frequency);

    const entries = await prisma.formEntry.findMany({
      where: {
        formInstanceId: instance.id,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: { id: true },
    });

    const done = entries.length > 0;

    return NextResponse.json({ ok: true, done });
  } catch (e) {
    console.error("forms.status error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
