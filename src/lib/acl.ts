// src/lib/acl.ts
import { prisma } from "@/lib/prisma";
import { RoleName } from "@prisma/client";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "default";

/**
 * Darf der Benutzer Doku-Sektionen verwalten?
 * => true für SUPERADMIN (global) oder ADMIN (global/marktbezogen)
 */
export async function canManageSections(
  principalId: string,
  marketId?: string | null
): Promise<boolean> {
  const roles = [RoleName.SUPERADMIN, RoleName.ADMIN];

  const match = await prisma.rbacAssignment.findFirst({
    where: {
      tenantId: TENANT_ID,
      principalId,
      role: { in: roles },
      // global (marketId=null) zählt immer; bei gesetztem Markt auch der spezifische
      OR: marketId ? [{ marketId }, { marketId: null }] : [{ marketId: null }],
    },
    select: { id: true },
  });

  return !!match;
}


