"use client";

import { useEffect, useState } from "react";

type Instance = {
  id: string;
  marketId: string | null;
  formDefinitionId: string;
  periodRef: string | null;
  status: string;
  updatedAt: string;
  definition: {
    id: string;
    label: string;
    marketId: string | null;
    period: string | null;
  };
};

export default function FormEditor({ id }: { id: string }) {
  const [inst, setInst] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Beispiel-Felder im Formular (passt du später an dein Schema an)
  const [ok, setOk] = useState(false);
  const [note, setNote] = useState("");
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  // Inline-Toast statt Browser-Alert
  const [saved, setSaved] = useState<null | "ok" | string>(null);
  useEffect(() => {
    if (saved === "ok") {
      const t = setTimeout(() => setSaved(null), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  // Instanz laden
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/metzgerei/instances/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        setInst(json.item);
      } catch (e: any) {
        setErr(e?.message || "Laden fehlgeschlagen");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSignAndSave() {
    try {
      if (!inst) throw new Error("Instanz nicht geladen.");

      // API erwartet: instanceId, date, data, initials, pin
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        instanceId: inst.id,
        date: isoDate,
        data: { ok, note },
        initials: initials.trim(),
        pin: pin.trim(),
      };

      const res = await fetch("/api/metzgerei/entries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      setSaved("ok");             // ✅ Inline-Bestätigung
    } catch (e: any) {
      setSaved(e?.message || "Speichern fehlgeschlagen"); // ✅ Inline-Fehler
    }
  }

  if (loading) return <div className="p-6">Lade…</div>;
  if (err) return <div className="p-6 text-red-700">{err}</div>;
  if (!inst) return <div className="p-6">Nicht gefunden.</div>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-extrabold">
        {inst.definition.label}
        <span className="text-sm font-normal opacity-60">
          {" "}
          · ID: {inst.id} · Zeitraum: {new Date().toLocaleDateString()} · Status: {inst.status}
        </span>
      </h1>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <section className="rounded-2xl border p-4 space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
            <span>OK</span>
          </label>

          <div>
            <div className="text-sm opacity-70 mb-1">Notiz</div>
            <textarea
              className="w-full rounded border p-2"
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notiz hier eingeben…"
            />
          </div>
        </section>

        <section className="rounded-2xl border p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <div className="text-sm opacity-70 mb-1">Initialen</div>
              <input
                className="w-full rounded border p-2"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                placeholder="AB"
              />
            </div>
            <div>
              <div className="text-sm opacity-70 mb-1">PIN</div>
              <input
                type="password"
                className="w-full rounded border p-2"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSignAndSave}
                className="rounded bg-black text-white px-4 py-2"
              >
                Speichern mit PIN
              </button>
            </div>
          </div>

          {/* ✅ Inline-Toast */}
          {saved && (
            <div
              className={`mt-3 text-sm rounded px-3 py-2 ${
                saved === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {saved === "ok" ? "Gespeichert." : saved}
            </div>
          )}
        </section>
      </form>
    </main>
  );
}
