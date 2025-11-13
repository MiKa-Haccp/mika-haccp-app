import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) Signatur prüfen
    const initials = body?.sign?.initials?.toUpperCase?.();
    const pin = body?.sign?.pin;
    const marketId = body?.marketId;

    if (!initials || !pin) {
      return NextResponse.json({ ok: false, error: "Missing sign info" }, { status: 400 });
    }
    if (!marketId) {
      return NextResponse.json({ ok: false, error: "Missing marketId" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const verifyRes = await fetch(`${origin}/api/auth/pin/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantId: TENANT, marketId, initials, pin }),
      cache: "no-store",
    });
    const ver = await verifyRes.json();
    if (!ver?.ok) {
      return NextResponse.json({ ok: false, error: "PIN verification failed" }, { status: 401 });
    }
    const principalId: string = ver?.principalId ?? initials;

    // 2) FormInstance ermitteln/anlegen
    let formInstanceId: string | null = body.formInstanceId ?? null;
    if (!formInstanceId) {
      if (!body.definitionId || !marketId || !body.periodRef) {
        return NextResponse.json({ ok: false, error: "Missing form instance identifiers" }, { status: 400 });
      }
      const inst = await prisma.formInstance.upsert({
        where: {
          tenantId_marketId_formDefinitionId_periodRef: {
            tenantId: TENANT,
            marketId,
            formDefinitionId: body.definitionId,
            periodRef: body.periodRef,
          },
        },
        update: {},
        create: {
          tenantId: TENANT,
          marketId,
          formDefinitionId: body.definitionId,
          year: Number(String(body.periodRef).slice(0, 4)),
          periodRef: body.periodRef,
          status: "open",
          previousYearRef: null,
          createdBy: principalId,
        },
        select: { id: true },
      });
      formInstanceId = inst.id;
    }

    // 3) Datum normalisieren (UTC Mitternacht)
    if (!body.date) {
      return NextResponse.json({ ok: false, error: "Missing date" }, { status: 400 });
    }
    const dateOnly = new Date(`${body.date}T00:00:00.000Z`);

    // 4) Upsert Tages-Eintrag
    const entry = await prisma.formEntry.upsert({
      where: { formInstanceId_date: { formInstanceId, date: dateOnly } },
      update: {
        dataJson: body.data ?? {},
        completedBy: principalId,
        signatureType: "initials+pin",
        signatureMeta: { initials },
      },
      create: {
        formInstanceId,
        date: dateOnly,
        dataJson: body.data ?? {},
        completedBy: principalId,
        signatureType: "initials+pin",
        signatureMeta: { initials },
      },
    });

    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    console.error("entries.upsert error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
