import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin-Liste aus ENV, Komma-getrennt
function isAdmin(email: string | undefined | null) {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function POST(req: Request) {
  // 1) Token aus Authorization-Header holen
  const auth = req.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;

  if (!token) {
    return NextResponse.json({ error: "no token" }, { status: 401 });
  }

  // 2) Nutzer aus Token lesen (mit ANON Key validieren)
  const supaForAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userErr } = await supaForAuth.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  // 3) Admin-Check
  if (!isAdmin(userData.user.email)) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  // 4) Request-Body lesen
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // 5) Einladung mit Service Role Key verschicken
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // nur Server!
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`;
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, user: data.user });
}

