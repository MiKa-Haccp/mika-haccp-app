// src/app/api/forms/entries/upsert/route.ts
import { NextResponse } from "next/server";
import { upsertEntryWithPin } from "@/lib/formEntries";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = await upsertEntryWithPin(body);
    return NextResponse.json({ ok: true, entry });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 400 });
  }
}
