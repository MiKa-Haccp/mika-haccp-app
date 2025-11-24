// src/app/api/metzgerei/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TENANT = "default";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const marketId = url.searchParams.get("marketId") || undefined;

    const baseDef = {
      tenantId: TENANT,
      active: true,
      categoryKey: "metzgerei",
    } as const;

    // --- Definitions: global (null) ODER marktbezogen (kein 'in: [id, null]'!)
    const definitions = await prisma.formDefinition.findMany({
      where: marketId
        ? { ...baseDef, OR: [{ marketId: marketId }, { marketId: null }] }
        : { ...baseDef, marketId: null },
      orderBy: { label: "asc" },
    });

    // --- Instanzen: nur laden, wenn marketId gesetzt (niemals equals:null!)
    const instances = marketId
      ? await prisma.formInstance.findMany({
          where: {
            marketId: marketId,      // wichtig: kein equals:null
            definition: { ...baseDef },
          },
          include: { definition: true },
          orderBy: { updatedAt: "desc" },
        })
      : [];

    return NextResponse.json({
      ok: true,
      marketId: marketId ?? null,
      definitions,
      instances,
    });
  } catch (err) {
    console.error("GET /api/metzgerei error", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
