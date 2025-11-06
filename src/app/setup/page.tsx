"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Setup() {
  const [name, setName] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(false); setLoading(true);

    // Access-Token holen
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setErr("Bitte zuerst einloggen.");
      setLoading(false);
      return;
    }

    // an API senden (mit Bearer-Token)
    const res = await fetch("/api/setup-market", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });

    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      setErr(j.error || "Fehler beim Einrichten");
      return;
    }

    setOk(true);
    setTimeout(()=> router.replace("/"), 800);
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-md mika-frame grid gap-4">
        <h1 className="text-xl font-bold mika-brand">Markt einrichten</h1>
        <label className="mika-label">Marktname</label>
        <input className="mika-input" placeholder="z. B. EDEKA Ortsname"
               value={name} onChange={e=>setName(e.target.value)} required />
        {err && <p className="text-sm" style={{color:"#b91c1c"}}>{err}</p>}
        {ok && <p className="text-sm" style={{color:"#166534"}}>Gespeichert ✅</p>}
        <button className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold" disabled={loading}>
          {loading ? "Bitte warten…" : "Anlegen"}
        </button>
      </form>
    </main>
  );
}
