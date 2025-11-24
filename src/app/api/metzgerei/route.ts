import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const marketId = url.searchParams.get("marketId"); // string | null

  // Basisfilter: nur aktive Metzgerei-Definitionen
  const baseDef = { active: true, categoryKey: "metzgerei" } as const;

  // ---- Definitionen: global ODER markt-spezifisch (wenn marketId da ist)
  const definitions = await prisma.formDefinition.findMany({
    where: marketId
      ? {
          ...baseDef,
          OR: [
            { marketId: { equals: marketId } },
            { marketId: { equals: null } },
          ],
        }
      : {
          ...baseDef,
          marketId: { equals: null },
        },
    orderBy: { label: "asc" },
  });

  // ---- Instanzen: gleiche Logik (wichtig: KEIN 'marketId: null' nackt!)
  const instances = await prisma.formInstance.findMany({
    where: marketId
      ? {
          definition: baseDef,
          OR: [
            { marketId: { equals: marketId } },
            { marketId: { equals: null } },
          ],
        }
      : {
          definition: baseDef,
          marketId: { equals: null },
        },
    include: { definition: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, marketId, definitions, instances });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { definitionId, marketId } = body as {
    definitionId: string;
    marketId?: string | null;
  };

  if (!definitionId) {
    return NextResponse.json({ error: "definitionId fehlt" }, { status: 400 });
  }

  const def = await prisma.formDefinition.findUnique({ where: { id: definitionId } });
  if (!def) {
    return NextResponse.json({ error: "Definition nicht gefunden" }, { status: 404 });
  }

  const instance = await prisma.formInstance.create({
    data: {
      tenantId: def.tenantId,
      formDefinitionId: def.id,
      // Wenn die Def marktgebunden ist, die der Def verwenden; sonst die übergebene marketId (oder null = global)
      marketId: def.marketId ?? marketId ?? null,
    },
  });

  return NextResponse.json({ id: instance.id });
}

