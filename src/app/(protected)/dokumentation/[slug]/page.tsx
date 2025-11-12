"use client";
import { useEffect, useState } from "react";

const DEF_MAP: Record<string, string> = {
  zust: "DEF_ZUST_MON",        // passe deine Keys an
  kuerzel: "DEF_KUERZEL_MON",
  schulungen: "DEF_SCHUL_MON",
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function DokuSectionPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const definitionId = DEF_MAP[slug] ?? "DEF_ZUST_MON";

  // DEV: hole aktive Markt-ID aus localStorage (bei dir ist Context bereits vorhanden)
  const [marketId, setMarketId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  // Formular-States
  const [date, setDate] = useState(todayISO());
  const [temp, setTemp] = useState<string>("");          // Beispiel-Feld
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!marketId) { setMsg("Kein Markt gewählt."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          definitionId,
          marketId,
          periodRef: date.slice(0,7),   // "YYYY-MM"
          date,
          data: { temp },               // Beispiel: ein Messwert
          sign: { initials, pin },      // DEV-sign
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setMsg(json?.error ?? "Speichern fehlgeschlagen");
      } else {
        setMsg("Gespeichert ✔");
        setPin(""); // Sicherheit: PIN leeren
      }
    } catch (err) {
      setMsg("Serverfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Dokumentation · {slug}</h1>

      <form onSubmit={onSave} className="max-w-xl space-y-3 rounded-2xl border p-4">
        <div className="grid gap-2">
          <label className="text-sm">
            Datum
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Temperatur (°C) – Beispiel
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full rounded border px-3 py-2"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="z. B. 4.0"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-sm">
              Initialen
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                placeholder="z. B. MD"
                required
              />
            </label>
            <label className="text-sm">
              PIN
              <input
                type="password"
                className="mt-1 w-full rounded border px-3 py-2"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4-stellig"
                required
              />
            </label>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={saving || !marketId}
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
          {msg && <span className="text-sm opacity-80">{msg}</span>}
          {!marketId && <span className="text-sm text-red-600">Bitte oben in der Navi einen Markt wählen.</span>}
        </div>
      </form>
    </main>
  );
}




