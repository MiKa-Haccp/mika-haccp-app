"use client";

import { useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  completedBy: string | null;
  signatureMeta: any;
  data: any;
};

type Status = "loading" | "ok" | "empty" | "error";

function getQuarterMonths(periodRef: string): number[] {
  // periodRef = "2025-Q1"
  const [yearStr, qStr] = periodRef.split("-Q");
  const q = Number(qStr);

  const startMonth = (q - 1) * 3 + 1;

  return [startMonth, startMonth + 1, startMonth + 2]; // z.B. [1,2,3]
}

function shiftQuarter(periodRef: string, delta: number): string {
  const [yStr, qStr] = periodRef.split("-Q");
  let year = Number(yStr);
  let quarter = Number(qStr);

  quarter += delta;

  while (quarter <= 0) {
    quarter += 4;
    year -= 1;
  }
  while (quarter > 4) {
    quarter -= 4;
    year += 1;
  }

  return `${year}-Q${quarter}`;
}

function currentQuarterRef(): string {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

export default function MetzgereiViertelReinigungDokuPage() {
  const [marketId, setMarketId] = useState<string | null>(null);
  const [periodRef, setPeriodRef] = useState<string>(currentQuarterRef());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // aktiven Markt holen
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

  // Ladedaten
  useEffect(() => {
    if (!marketId) {
      setStatus("empty");
      setEntries([]);
      return;
    }

    const controller = new AbortController();
    async function load() {
      setStatus("loading");
      setErrorMsg(null);

      const params = new URLSearchParams({
        definitionId: "FORM_METZ_VIERTEL_REINIGUNG",
        marketId,
        periodRef,
      });

      try {
        const res = await fetch(`/api/forms/entries/month?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          setStatus("error");
          setErrorMsg("Serverfehler beim Laden");
          return;
        }

        const json = await res.json();
        const e = Array.isArray(json.entries) ? json.entries : [];
        setEntries(e);
        setStatus(e.length > 0 ? "ok" : "empty");
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setStatus("error");
          setErrorMsg("Netzwerkfehler");
        }
      }
    }

    load();
    return () => controller.abort();
  }, [marketId, periodRef]);

  const quarterLabel = useMemo(() => {
    const [yearStr, qStr] = periodRef.split("-Q");
    return `Q${qStr} ${yearStr}`;
  }, [periodRef]);

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Dokumentation · Metzgerei · Vierteljährliche Reinigung
          </h1>
          <p className="text-sm opacity-70">
            Übersicht aller Einträge für dieses Quartal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setPeriodRef((prev) => shiftQuarter(prev, -1))}
          >
            ◀
          </button>
          <span className="text-sm font-medium w-32 text-center">
            {quarterLabel}
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setPeriodRef((prev) => shiftQuarter(prev, +1))}
          >
            ▶
          </button>
        </div>
      </header>

      {!marketId && (
        <p className="text-sm text-red-600">
          Bitte oben in der Navigation zuerst einen Markt auswählen.
        </p>
      )}

      {/* Detailtabelle */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Einträge</h2>

        {entries.length === 0 ? (
          <p className="text-xs opacity-70">Keine Einträge in diesem Quartal.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-1">Datum</th>
                  <th className="text-left px-3 py-1">Erledigt durch</th>
                  <th className="text-left px-3 py-1">Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-3 py-1">
                      {new Date(e.date).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-3 py-1">
                      {e.completedBy ??
                        e.signatureMeta?.initials ??
                        "–"}
                    </td>
                    <td className="px-3 py-1 max-w-[340px]">
                      <pre className="whitespace-pre-wrap break-words opacity-80">
                        {e.data?.beschreibung ?? "Keine Daten"}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
