"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminInvitePage() {
  const [email, setEmail] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.email ?? null));
  }, []);

 const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMsg(null); setErr(null);
  setLoading(true);

  // 1) Session vom Client holen
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // 2) Request mit Bearer-Token senden
  const res = await fetch("/api/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ email }),
  });

  setLoading(false);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    setErr(j.error || "Fehler beim Senden");
    return;
  }
  setMsg("Einladung versendet ✅");
  setEmail("");
};

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mika-frame grid gap-4">
        <h1 className="text-2xl font-bold mika-brand">Benutzer einladen</h1>
        <p className="text-sm opacity-70">
          Als eingeloggter Admin kannst du hier Einladungs-E-Mails verschicken.
        </p>

        <form onSubmit={submit} className="grid gap-3">
          <label className="mika-label">E-Mail des neuen Nutzers</label>
          <input
            type="email"
            required
            className="mika-input w-full"
            placeholder="name@firma.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <button className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold" disabled={loading}>
              {loading ? "Sende…" : "Einladung senden"}
            </button>
            <button type="button" className="text-sm mika-link" onClick={() => router.push("/")}>
              Zurück
            </button>
          </div>

          {msg && <p className="text-sm" style={{ color: "#166534" }}>{msg}</p>}
          {err && <p className="text-sm" style={{ color: "#b91c1c" }}>{err}</p>}

          <p className="text-xs opacity-60">Angemeldet als: {me ?? "–"}</p>
        </form>
      </div>
    </main>
  );
}
