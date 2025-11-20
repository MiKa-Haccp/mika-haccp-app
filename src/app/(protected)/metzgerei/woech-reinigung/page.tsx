"use client";

import { useEffect, useState } from "react";

const DEF_ID = "FORM_METZ_WOCH_REINIGUNG";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function MetzgereiWochReinigungPage() {
  const [marketId, setMarketId] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [done, setDone] = useState(false); // Beispiel: Checkbox "Reinigung erledigt"
  const [note, setNote] = useState("");

  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!marketId) {
      setMsg("Kein Markt gewählt.");
      return;
    }
    if (!initials || !pin) {
      setMsg("Initialen und PIN eingeben.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        definitionId: DEF_ID,
        marketId,
        periodRef: date.slice(0, 7), // "YYYY-MM"
        date,
        data: { done, note }, // -> hier kannst du später weitere Felder ergänzen
        sign: { initials, pin },
      };

      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMsg(json?.error ?? "Speichern fehlgeschlagen");
      } else {
        setMsg("Gespeichert ✔");
        setPin("");
      }
    } catch (err) {
      setMsg("Serverfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Metzgerei · Wöchentliche Reinigung</h1>
      <p className="text-sm opacity-70">
        Erfassung für eine Woche. Die Einträge erscheinen in der
        Dokumentation unter „Metzgerei · Wöchentliche Reinigung“.
      </p>

      {!marketId && (
        <p className="text-sm text-red-600">
          Bitte oben in der Navigation zuerst einen Markt auswählen.
        </p>
      )}

      <form onSubmit={onSave} className="max-w-xl space-y-3 rounded-2xl border p-4">
        <label className="text-sm block">
          Datum
          <input
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => setDone(e.target.checked)}
          />
          Reinigung für diese Woche erledigt
        </label>

        <label className="text-sm block">
          Bemerkungen (optional)
          <textarea
            className="mt-1 w-full rounded border px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
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
              placeholder="4–6-stellig"
              required
            />
          </label>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={saving || !marketId}
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
          {msg && <span className="text-sm opacity-80">{msg}</span>}
        </div>
      </form>
    </main>
  );
}

