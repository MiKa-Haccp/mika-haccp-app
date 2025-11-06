import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Section = { number: number; title: string };

const TEMPLATE: Record<"allgemein"|"markt"|"metzgerei", Section[]> = {
  allgemein: [
    { number: 1, title: "Verantwortlichkeiten" },
    { number: 2, title: "Kürzelliste Mitarbeiter" },
    { number: 3, title: "Dokumentation und Ablage" },
  ],
  markt: [
    { number: 1, title: "Warenzustand Obst und Gemüse" },
    { number: 2, title: "Reinigungsdokumentation täglich" },
    { number: 3, title: "Temperaturen Carrier Portal" },
  ],
  metzgerei: [
    { number: 1,  title: "WE SBF" },
    { number: 2,  title: "WE Deutsche See" },
    { number: 11, title: "Temperaturen Dry Age - Käse" },
  ],
};

export async function POST(req: Request) {
  // 0) Token aus Header
  const auth = req.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 401 });

  // 1) User validieren (ANON-Client mit Token im Header)
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: userRes, error: userErr } = await anon.auth.getUser();
  if (userErr || !userRes?.user) return NextResponse.json({ error: "invalid token" }, { status: 401 });
  const user = userRes.user;

  // 2) Payload
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "market name required" }, { status: 400 });

  // 3) Service-Client (um RLS beim Schreiben zu umgehen) — NUR SERVERSEITIG!
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // <-- kein NEXT_PUBLIC!
  );

  // 4) Markt anlegen (mit created_by)
  const { data: mkt, error: mErr } = await service
    .from("markets")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 });

  // 5) Mitgliedschaft als Admin
  const { error: mmErr } = await service
    .from("market_members")
    .insert({ market_id: mkt.id, user_id: user.id, role: "admin" });
  if (mmErr) return NextResponse.json({ error: mmErr.message }, { status: 400 });

  // 6) Spaces
  const spacesInsert = [
    { key: "allgemein", name: "Allgemein", sort: 1 },
    { key: "markt",     name: "Markt",     sort: 2 },
    { key: "metzgerei", name: "Metzgerei", sort: 3 },
  ].map(s => ({ ...s, market_id: mkt.id }));

  const { data: spaces, error: spErr } = await service
    .from("spaces")
    .insert(spacesInsert)
    .select("id,key");
  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 400 });

  const spaceIdByKey: Record<string,string> = {};
  spaces?.forEach(s => { spaceIdByKey[s.key] = s.id; });

  // 7) Sections
  const sections = (Object.entries(TEMPLATE) as Array<[keyof typeof TEMPLATE, Section[]]>)
    .flatMap(([k, arr]) => arr.map(sec => ({
      market_id: mkt.id,
      space_id: spaceIdByKey[k],
      number: sec.number,
      title: sec.title,
    })));

  if (sections.length) {
    const { error: secErr } = await service.from("sections").insert(sections);
    if (secErr) return NextResponse.json({ error: secErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, market_id: mkt.id });
}


