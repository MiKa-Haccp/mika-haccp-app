import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function ymd(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// GET /api/metzgerei/instances/:id?date=YYYY-MM-DD
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const instance = await prisma.formInstance.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!instance) return NextResponse.json({ ok: false, error: "Instance not found" }, { status: 404 });

    const date = ymd(); // heute (einfach gehalten)
    const entry = await prisma.formEntry.findUnique({
      where: { formInstanceId_date: { formInstanceId: id, date: new Date(`${date}T00:00:00.000Z`) } },
    });

    return NextResponse.json({ ok: true, instance, entry, date }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfehler" }, { status: 500 });
  }
}
