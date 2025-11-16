"use client";

import { useEffect, useState } from "react";

type SaveStatus = "idle" | "saving" | "ok" | "error";

function getQuarterRef(date: Date): string {
  const y = date.getFullYear();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${y}-Q${q}`;
}

export default function MetzgereiViertelReinigungFormPage() {
  const today = new Date();
  const [marketId, setMarketId] = useState<string | null>(null);

  const [date, setDate] = useState<string>(today.toISOString().slice(0, 10));
  const [beschreibung, setBeschreibung] = useState("");
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
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

    setStatus("saving");

    const dt = new Date(date);
    const periodRef = getQuarterRef(dt);

    try {
      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          definitionId: "FORM_METZ_VIERTEL_REINIGUNG",
          marketId,
          periodRef,
          date,
          data: { beschreibung },
          sign: {
            initials: initials.toUpperCase(),
            pin,
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setStatus("error");
        setMsg(json?.error ?? "Speichern fehlgeschlagen.");
        return;
      }

      setStatus("ok");
      setMsg("Gespeichert ✔");
      setPin("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMsg("Serverfehler.");
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Metzgerei · vierteljährliche Reinigung</h1>
      <p className="text-sm opacity-70">
        Eintrag für die vierteljährliche Reinigung. Wird in der Dokumentation angezeigt.
      </p>

      {!marketId && (
        <p className="text-sm text-red-600">Bitte zuerst Markt wählen.</p>
      )}

      <form onSubmit={onSubmit} className="max-w-xl rounded-2xl border p-4 space-y-3">
        <label className="text-sm block">
          Datum
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded border px-3 py-2 w-full"
          />
        </label>

        <label className="text-sm block">
          Beschreibung / Bereiche
          <textarea
            className="mt-1 rounded border px-3 py-2 w-full min-h-[80px]"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            placeholder="Welche Bereiche wurden gereinigt?"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm block">
            Initialen
            <input
              className="mt-1 rounded border px-3 py-2 w-full"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              required
            />
          </label>
          <label className="text-sm block">
            PIN
            <input
              type="password"
              className="mt-1 rounded border px-3 py-2 w-full"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving" || !marketId}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {status === "saving" ? "Speichere…" : "Speichern"}
          </button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </form>
    </main>
  );
}
