import { prisma } from "@/lib/prisma";
import { RbacRole } from "@prisma/client";

export async function canManageSections(
  principalId: string,
  tenantId: string,
  marketId?: string | null
) {
  // TEMP-Schutz: Wenn Model im Client fehlt, alles erlauben (lokal)
  const hasModel = !!(prisma as any).rbacAssignment;
  if (!hasModel) {
    console.warn("[RBAC TEMP] prisma.rbacAssignment fehlt im Client – erlaube alles");
    return true;
  }

  const superAdmin = await (prisma as any).rbacAssignment.findFirst({
    where: { tenantId, marketId: null, principalId, role: RbacRole.SUPERADMIN },
  });
  if (superAdmin) return true;

  if (marketId) {
    const admin = await (prisma as any).rbacAssignment.findFirst({
      where: { tenantId, marketId, principalId, role: RbacRole.ADMIN },
    });
    if (admin) return true;
  }
  return false;
}



