"use client";

import { useEffect, useState } from "react";

type SaveStatus = "idle" | "saving" | "ok" | "error";

/** ISO-Monatsreferenz: YYYY-MM */
function getMonthRef(dateISO: string) {
  return dateISO.slice(0, 7);
}

export default function MetzgereiSalatOeffnungFormPage() {
  const today = new Date();
  const [marketId, setMarketId] = useState<string | null>(null);

  const [date, setDate] = useState<string>(today.toISOString().slice(0, 10)); // YYYY-MM-DD
  const [salatName, setSalatName] = useState("");
  const [charge, setCharge] = useState("");
  const [mhd, setMhd] = useState("");
  const [bemerkung, setBemerkung] = useState("");

  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

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
    if (!salatName) {
      setMsg("Name des Salats eingeben.");
      return;
    }

    setStatus("saving");

    const periodRef = getMonthRef(date);

    try {
      const res = await fetch("/api/forms/entries/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          definitionId: "FORM_METZ_SALAT_OEFFNUNG",
          marketId,
          periodRef,
          date,
          data: {
            salatName,
            charge,
            mhd,
            bemerkung,
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
      // optional Felder leeren:
      // setSalatName(""); setCharge(""); setMhd(""); setBemerkung("");
    } catch (err) {
      console.error("salat-oeffnung save error", err);
      setStatus("error");
      setMsg("Serverfehler beim Speichern.");
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-2">
        Metzgerei · Salatöffnung
      </h1>
      <p className="text-sm opacity-70 mb-4">
        Einfache Liste: Wann wurde welcher Salat geöffnet (inkl. Charge / MHD).
        Diese Einträge erscheinen in der Dokumentation.
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
          Datum der Öffnung
          <input
            type="date"
            className="mt-1 w-full rounded border px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="text-sm block">
          Salat / Produktname
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={salatName}
            onChange={(e) => setSalatName(e.target.value)}
            placeholder="z. B. Kartoffelsalat 3kg Eimer"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm block">
            Charge / Los-Nr. (optional)
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
              placeholder="z. B. L12345"
            />
          </label>

          <label className="text-sm block">
            MHD (optional)
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2"
              value={mhd}
              onChange={(e) => setMhd(e.target.value)}
            />
          </label>
        </div>

        <label className="text-sm block">
          Bemerkungen (optional)
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 min-h-[60px]"
            value={bemerkung}
            onChange={(e) => setBemerkung(e.target.value)}
            placeholder="z. B. angebrochen, Restmenge, Auffälligkeiten …"
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
