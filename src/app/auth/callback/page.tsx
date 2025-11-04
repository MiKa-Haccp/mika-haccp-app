"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Verhindert statisches Vor-Rendern
export const dynamic = "force-dynamic";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [stage, setStage] = useState<"checking" | "setpw" | "done" | "nosession">("checking");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const type = params.get("type");

    // 1) Wenn Invite/Recovery → immer Passwort-Formular zeigen
    if (type === "invite" || type === "recovery") {
      setStage("setpw");
      return;
    }

    // 2) Alle anderen Fälle → auf Start
    setStage("done");
    router.replace("/");
  }, [params, router]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // Optional: sicherstellen, dass eine Session existiert (Invite-Link setzt sie i.d.R.)
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setLoading(false);
      setStage("nosession");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    // Danach in die App
    router.replace("/");
  };

  if (stage === "checking") {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        Bitte warten…
      </main>
    );
  }

  if (stage === "nosession") {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md mika-frame grid gap-4">
          <h1 className="text-xl font-bold mika-brand">Sitzung nicht gefunden</h1>
          <p className="opacity-80 text-sm">
            Bitte öffne den Link direkt aus der Einladungs-/Reset-E-Mail, damit wir dich
            erkennen können. Alternativ melde dich zuerst an und rufe dann den Link erneut auf.
          </p>
          <a href="/login" className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold text-center">
            Zum Login
          </a>
        </div>
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


