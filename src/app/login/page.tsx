"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Page() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) return setErr(error.message);
    router.push("/");
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onLogin} className="w-full max-w-sm space-y-3 border rounded-lg p-4 bg-white">
        <h1 className="text-xl font-semibold">MiKa HACCP – Login</h1>
        <input className="border p-2 w-full" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Passwort" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="border p-2 w-full">Einloggen</button>
      </form>
    </main>
  );
}
