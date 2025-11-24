import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RoleName } from "@prisma/client";

const TENANT = "T1";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const principalId: string | undefined = body?.principalId;
    const role: string | undefined = body?.role;
    const marketId: string | null | undefined = body?.marketId ?? null;
    const enable: boolean = !!body?.enable;

    if (!principalId || !role) {
      return NextResponse.json(
        { ok: false, error: "Missing principalId or role" },
        { status: 400 }
      );
    }

    const roleEnum = role as RoleName;

    if (enable) {
      // --- Rolle einschalten ---
      if (roleEnum === "SUPERADMIN") {
        // globale Rolle, ohne Markt
        await prisma.rbacAssignment.upsert({
          where: {
            tenantId_principalId_role: {
              tenantId: TENANT,
              principalId,
              role: roleEnum,
            },
          },
          update: {},
          create: {
            tenantId: TENANT,
            marketId: { equals: null },
            principalId,
            role: roleEnum,
          },
        });
      } else {
        // marktbezogene Admin/Staff-Rolle
        if (!marketId) {
          return NextResponse.json(
            { ok: false, error: "marketId required for non-global roles" },
            { status: 400 }
          );
        }

        await prisma.rbacAssignment.upsert({
          where: {
            tenantId_marketId_principalId_role: {
              tenantId: TENANT,
              marketId,
              principalId,
              role: roleEnum,
            },
          },
          update: {},
          create: {
            tenantId: TENANT,
            marketId,
            principalId,
            role: roleEnum,
          },
        });
      }
    } else {
      // --- Rolle ausschalten ---
      if (roleEnum === "SUPERADMIN") {
        await prisma.rbacAssignment.deleteMany({
          where: {
            tenantId: TENANT,
            principalId,
            role: roleEnum,
            marketId: { equals: null },
          },
        });
      } else {
        await prisma.rbacAssignment.deleteMany({
          where: {
            tenantId: TENANT,
            principalId,
            role: roleEnum,
            marketId: marketId ?? undefined,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("staff.set-role error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
