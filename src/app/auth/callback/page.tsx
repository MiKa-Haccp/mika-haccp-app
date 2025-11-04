"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Optional, hilft gegen statische Vor-Render-Probleme:
export const dynamic = "force-dynamic";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [stage, setStage] = useState<"checking" | "setpw" | "done">("checking");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Erkennen, ob Invite/Recovery → Passwort setzen anzeigen
  useEffect(() => {
    const type = params.get("type");
    // Wenn Supabase den Code als Param liefert, Session herstellen (PKCE Flows)
    const token = params.get("token") || params.get("code");
    if (token && (type === "invite" || type === "recovery")) {
      // Bei neueren Flows reicht oft die URL – exchangeCodeForSession nur, wenn nötig:
      // Wir probieren es, Fehler ignorieren wir (Session evtl. schon gesetzt)
      supabase.auth.exchangeCodeForSession(token).catch(() => {});
      setStage("setpw");
    } else {
      setStage("done");
      router.replace("/");
    }
  }, [params, router]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return setErr(error.message);
    router.replace("/");
  };

  if (stage === "checking") {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        Bitte warten…
      </main>
    );
  }

  if (stage === "setpw") {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <form onSubmit={onSave} className="w-full max-w-md mika-frame grid gap-4">
          <h1 className="text-xl font-bold mika-brand">Passwort festlegen</h1>
          <input
            type="password"
            className="mika-input w-full"
            placeholder="Neues Passwort"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          {err && <p className="text-sm" style={{ color: "#b91c1c" }}>{err}</p>}
          <button
            className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold"
            disabled={loading}
          >
            {loading ? "Bitte warten…" : "Speichern & weiter"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      Weiterleitung…
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-6">
          Bitte warten…
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

