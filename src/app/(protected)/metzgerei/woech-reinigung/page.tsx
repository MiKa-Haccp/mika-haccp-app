"use client";

import { useEffect, useState } from "react";

type SaveStatus = "idle" | "saving" | "ok" | "error";

/** ISO-Wochenreferenz berechnen, z.B. 2025-W46 */
function getISOWeekRef(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // 1–7, Montag=1
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  const year = date.getUTCFullYear();
  return `${year}-W${weekNo.toString().padStart(2, "0")}`;
}

export default function MetzgereiWoechReinigungFormPage() {
  const today = new Date();
  const [marketId, setMarketId] = useState<string | null>(null);

  const [date, setDate] = useState<string>(today.toISOString().slice(0, 10)); // YYYY-MM-DD
  const [bemerkung, setBemerkung] = useState("");
  const [initials, setInitials] = useState("");
  const [pin,   setPin] = useState("");

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  // aktiven Markt holen
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
      setMsg("Kein Markt gewählt (oben in der Navigation auswählen).");
      return;
    }
    if (!initials || !pin) {
      setMsg("Initialen und PIN eingeben.");
      return;
    }

    setStatus("saving");

    const dt = new Date(date);
    const periodRef = getISOWeekRef(dt); // z.B. 2025-W46

    try {
      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          definitionId: "FORM_METZ_WOCH_REINIGUNG",
          marketId,
          periodRef,
          date,
          data: {
            bemerkung,
            // hier später die echten Felder aus deinem Wochenplan ergänzen
          },
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
      setPin(""); // PIN leeren
    } catch (err) {
      console.error("woech-reinigung save error", err);
      setStatus("error");
      setMsg("Serverfehler beim Speichern.");
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-2">
        Metzgerei · wöchentliche Reinigung
      </h1>
      <p className="text-sm opacity-70 mb-4">
        Erfassung der wöchentlichen Reinigungen. Die Einträge erscheinen später
        in der Dokumentation unter „Metzgerei · wöchentliche Reinigung“.
      </p>

      {!marketId && (
        <p className="mb-4 text-sm text-red-600">
          Bitte oben in der Navigation einen Markt auswählen.
        </p>
      )}

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-3 rounded-2xl border p-4"
      >
        <label className="text-sm block">
          Datum
          <input
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="text-sm block">
          Bemerkungen / Bereiche (vereinfacht)
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 min-h-[80px]"
            value={bemerkung}
            onChange={(e) => setBemerkung(e.target.value)}
            placeholder="z.B. Kühlraum, Theke, Böden …"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm block">
            Initialen
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              placeholder="z. B. MD"
              required
            />
          </label>
          <label className="text-sm block">
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={status === "saving" || !marketId}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {status === "saving" ? "Speichere…" : "Speichern"}
          </button>
          {msg && <span className="text-sm opacity-80">{msg}</span>}
        </div>
      </form>
    </main>
  );
}
