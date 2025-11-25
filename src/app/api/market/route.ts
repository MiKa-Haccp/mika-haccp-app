// src/app/api/market/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Temporärer Stub, bis das Market-Model in Prisma existiert
  return NextResponse.json({
    ok: true,
    markets: [
      { id: "GLOBAL", name: "Global" },
      { id: "TEST", name: "Testmarkt" },
    ],
  });
}
