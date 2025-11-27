// src/app/api/doku/metzgerei/instances/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: any) {
  const { id } = await ctx.params;
  const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "T1";

  try {
    const instance = await prisma.formInstance.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        // category: "METZGEREI",
      },
      include: {
        definition: true,
        entries: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: instance.id,
      year: (instance as any).year ?? null,
      month: (instance as any).month ?? null,
      definition: {
        id: instance.definition.id,
        name: instance.definition.name,
        // hier könntest du auch schema etc. mitsenden
      },
      entries: instance.entries.map((e) => ({
        id: e.id,
        date: e.date,
        data: e.data,
        initials: (e as any).initials ?? null,
        signatureMeta: (e as any).signatureMeta ?? null,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/doku/metzgerei/instances/[id] error", error);
    return NextResponse.json(
      { error: "Failed to load documentation instance" },
      { status: 500 }
    );
  }
}
