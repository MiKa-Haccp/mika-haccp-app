"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (error) return setErr(error.message);
    setSent(true);
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSend} className="w-full max-w-md mika-frame grid gap-4">
        <h1 className="text-xl font-bold mika-brand">Passwort zurücksetzen</h1>
        {!sent ? (
          <>
            <input
              type="email"
              required
              className="mika-input w-full"
              placeholder="E-Mail"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold">Mail senden</button>
          </>
        ) : (
          <p>Wir haben dir eine E-Mail mit einem Link gesendet.</p>
        )}
      </form>
    </main>
  );
}
