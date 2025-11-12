import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "T1";

/**
 * Body erwartet:
 * {
 *   "formInstanceId": "xxx",      // oder alternativ: definitionId + marketId + periodRef
 *   "definitionId": "DEF_ZUST_MON",
 *   "marketId": "089d...",
 *   "periodRef": "2025-11",
 *   "date": "2025-11-12",         // ISO (nur datum)
 *   "data": { ... },              // beliebige Felder des Formulars
 *   "sign": { "initials": "MD", "pin": "1234" }  // DEV-Variante
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) Signatur validieren (DEV: via internes fetch auf unsere Verify-Route)
    if (!body?.sign?.initials || !body?.sign?.pin) {
      return NextResponse.json({ ok: false, error: "Missing sign info" }, { status: 400 });
    }

    const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/auth/pin/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initials: body.sign.initials, pin: body.sign.pin }),
      cache: "no-store",
    });
    const ver = await verifyRes.json();
    if (!ver?.ok) {
      return NextResponse.json({ ok: false, error: "PIN verification failed" }, { status: 401 });
    }
    const principalId: string = ver.principalId ?? body.sign.initials;

    // 2) FormInstance ermitteln
    let formInstanceId: string | null = body.formInstanceId ?? null;

    if (!formInstanceId) {
      if (!body.definitionId || !body.marketId || !body.periodRef) {
        return NextResponse.json({ ok: false, error: "Missing form instance identifiers" }, { status: 400 });
      }
      // sicherstellen, dass die Instanz existiert
      const inst = await prisma.formInstance.upsert({
        where: {
          tenantId_marketId_formDefinitionId_periodRef: {
            tenantId: TENANT,
            marketId: body.marketId,
            formDefinitionId: body.definitionId,
            periodRef: body.periodRef,
          },
        },
        update: {},
        create: {
          tenantId: TENANT,
          marketId: body.marketId,
          formDefinitionId: body.definitionId,
          year: Number((body.periodRef as string).slice(0, 4)),
          periodRef: body.periodRef,
          status: "open",
          previousYearRef: null,
          createdBy: principalId,
        },
        select: { id: true },
      });
      formInstanceId = inst.id;
    }

    // 3) Datum normalisieren
    if (!body.date) {
      return NextResponse.json({ ok: false, error: "Missing date" }, { status: 400 });
    }
    const dateOnly = new Date(`${body.date}T00:00:00.000Z`); // UTC Mitternacht

    // 4) Upsert des Tages-Eintrags
    const entry = await prisma.formEntry.upsert({
      where: {
        formInstanceId_date: { formInstanceId, date: dateOnly },
      },
      update: {
        dataJson: body.data ?? {},
        completedBy: principalId,
        signatureType: "initials+pin",
        signatureMeta: { initials: body?.sign?.initials },
      },
      create: {
        formInstanceId,
        date: dateOnly,
        dataJson: body.data ?? {},
        completedBy: principalId,
        signatureType: "initials+pin",
        signatureMeta: { initials: body?.sign?.initials },
      },
    });

    // 5) (optional) Monatsstatus aktualisieren (einfach gehalten)
    // z.B.: wenn alle Tage ausgefüllt -> status = 'ok'
    // Wir überspringen hier Logik und lassen 'open'.

    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    console.error("entries.upsert error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
