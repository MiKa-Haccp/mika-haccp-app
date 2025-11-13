"use client";

import { use, useEffect, useMemo, useState } from "react";

const DEF_MAP: Record<string, string> = {
  zust: "DEF_ZUST_MON",
  kuerzel: "DEF_KUERZEL_MON",
  schulungen: "DEF_SCHUL_MON",
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Echte Monatslänge bestimmen
function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number); // "YYYY-MM"
  return new Date(y, m, 0).getDate(); // 0 = letzter Tag Vormonat → hier: letzter Tag des gewünschten Monats
}

export default function DokuSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Next 16: params sind ein Promise
}) {
  // Next 16: params via use(...) entpacken
  const { slug } = use(params);
  const definitionId = DEF_MAP[slug] ?? "DEF_ZUST_MON";

  // aktiver Markt aus localStorage
  const [marketId, setMarketId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  // Formular-States (Beispiel-Feld "temp")
  const [date, setDate] = useState(todayISO());
  const [temp, setTemp] = useState<string>("");
  const [initials, setInitials] = useState("");
  const [pin, setPin] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Monatsübersicht
  type MonthItem = { date: string; completedBy?: string | null };
  const [monthEntries, setMonthEntries] = useState<MonthItem[]>([]);

  const periodRef = useMemo(() => date.slice(0, 7), [date]); // "YYYY-MM"
  const monthLen = useMemo(() => daysInMonth(periodRef), [periodRef]);

  async function reloadMonth(defId: string, mk: string, ym: string) {
    try {
      const res = await fetch(
        `/api/forms/entries/by-month?definitionId=${encodeURIComponent(
          defId
        )}&marketId=${encodeURIComponent(mk)}&periodRef=${ym}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (json?.ok) {
        const list = (json.entries as any[]).map((e) => ({
          date: new Date(e.date).toISOString().slice(0, 10),
          completedBy: e.completedBy ?? null,
        }));
        setMonthEntries(list);
      } else {
        setMonthEntries([]);
      }
    } catch {
      setMonthEntries([]);
    }
  }

  // Initial laden, wenn Markt da
  useEffect(() => {
    if (marketId) reloadMonth(definitionId, marketId, periodRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, definitionId, periodRef]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const mk = marketId;
    if (!mk) {
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
        definitionId,
        marketId: mk,
        periodRef, // "YYYY-MM"
        date,
        data: { temp }, // Beispielpayload
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
        // Monat neu laden
        await reloadMonth(definitionId, mk, periodRef);
      }
    } catch {
      setMsg("Serverfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Dokumentation · {slug}</h1>

      <form
        onSubmit={onSave}
        className="max-w-xl space-y-3 rounded-2xl border p-4"
      >
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
                placeholder="4–6-stellig"
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
          {!marketId && (
            <span className="text-sm text-red-600">
              Bitte oben in der Navi einen Markt wählen.
            </span>
          )}
        </div>
      </form>

      {/* Monatsübersicht */}
      <section className="rounded-2xl border p-4">
        <h2 className="font-semibold mb-2">Monat {periodRef}</h2>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {Array.from({ length: monthLen }).map((_, i) => {
            const d = i + 1;
            const iso = `${periodRef}-${String(d).padStart(2, "0")}`;
            const hit = monthEntries.find((e) => e.date === iso);
            return (
              <div key={iso} className="rounded border p-2 min-h-16">
                <div className="text-xs opacity-60">{d}.</div>
                {hit ? (
                  <div className="mt-1 text-green-700">
                    ✓ {hit.completedBy ?? ""}
                  </div>
                ) : (
                  <div className="mt-1 opacity-40">–</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}





