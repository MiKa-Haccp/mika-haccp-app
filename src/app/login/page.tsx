"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Brand, { ShieldIcon } from "@/components/Brand";

export default function Page() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });
    setLoading(false);
    if (error) return setErr(error.message);
    router.push("/");
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      {/* Karte im MiKa-Look */}
      <div className="w-full max-w-lg mika-frame">
        {/* Kopf mit Logo + Titel */}
        <div className="flex items-center gap-4 mb-8">
          <div className="mika-brand">
            <ShieldIcon className="h-12 w-12" />
          </div>
          <div className="mika-brand">
            <h1 className="text-3xl font-extrabold">
              MiKa HACCP
            </h1>
            <p className="mt-1 opacity-80 text-sm mika-ink">
              Ihr digitaler Partner für Lebensmittelsicherheit
            </p>
          </div>
        </div>

        {/* Formular */}
        <form onSubmit={onLogin} className="grid gap-4">
          <label className="mika-label">E-Mail</label>
          <input
            type="email"
            required
            autoComplete="username"
            className="mika-input w-full"
            placeholder="name@firma.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="mika-label">Passwort</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="mika-input w-full"
            placeholder="••••••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          {err && <p className="text-sm" style={{ color: "#b91c1c" }}>{err}</p>}

          <button className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold shadow" disabled={loading}>
            {loading ? "Bitte warten…" : "Einloggen"}
          </button>
          
          <p className="text-center text-xs opacity-70">
            <a href="/reset" className="mika-link">Passwort vergessen?</a>
          </p>

          <p className="text-center text-xs opacity-70">
            Zugriff nur für autorisierte Mitarbeiter/innen.
          </p>
        </form>
      </div>
    </main>
  );
}

