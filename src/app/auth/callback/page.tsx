"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wenn der User mit einem Token kommt, Session setzen
  useEffect(() => {
    const type = params.get("type");
    const token = params.get("token");
    if (token && type === "invite") {
      supabase.auth.exchangeCodeForSession(token).then(({ error }) => {
        if (error) setErr(error.message);
      });
    }
  }, [params]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (error) return setErr(error.message);
    setMsg("Passwort gespeichert ✅ – Du kannst dich jetzt einloggen.");
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form
        onSubmit={handleSave}
        className="w-full max-w-sm space-y-3 border rounded-lg p-4 bg-white"
      >
        <h1 className="text-xl font-semibold">Passwort festlegen</h1>
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Neues Passwort"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button className="border p-2 w-full" disabled={loading}>
          {loading ? "Speichern…" : "Passwort speichern"}
        </button>
      </form>
    </main>
  );
}
