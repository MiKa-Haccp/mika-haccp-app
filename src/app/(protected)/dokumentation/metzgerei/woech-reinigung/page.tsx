"use client";

import { useEffect, useMemo, useState } from "react";

type WeekEntry = {
  id: string;
  date: string;
  completedBy: string | null;
  signatureType: string | null;
  signatureMeta: any;
  data: any;
};

type Status = "loading" | "ok" | "empty" | "error";

function getISOWeekRef(d: Date): string {
  // ISO-Woche berechnen
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // 1–7, Montag = 1
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  const year = date.getUTCFullYear();
  return `${year}-W${weekNo.toString().padStart(2, "0")}`;
}

function shiftWeekRef(ref: string, delta: number): string {
  const [yStr, wStr] = ref.split("-W");
  let year = Number(yStr);
  let week = Number(wStr);

  week += delta;
  while (week <= 0) {
    year -= 1;
    const lastDec = new Date(Date.UTC(year, 11, 31));
    week = Number(getISOWeekRef(lastDec).split("-W")[1]);
  }
  while (true) {
    const lastDec = new Date(Date.UTC(year, 11, 31));
    const maxWeek = Number(getISOWeekRef(lastDec).split("-W")[1]);
    if (week > maxWeek) {
      week -= maxWeek;
      year += 1;
    } else break;
  }

  return `${year}-W${week.toString().padStart(2, "0")}`;
}

function formatWeekLabel(ref: string): string {
  const [yStr, wStr] = ref.split("-W");
  return `KW ${Number(wStr)} / ${yStr}`;
}

export default function MetzgereiWoechReinigungDokuPage() {
  const [marketId, setMarketId] = useState<string | null>(null);
  const [weekRef, setWeekRef] = useState(() => getISOWeekRef(new Date()));

  const [status, setStatus] = useState<Status>("loading");
  const [entries, setEntries] = useState<WeekEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {}
  }, []);

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

      try {
        const params = new URLSearchParams({
          definitionId: "FORM_METZ_WOCH_REINIGUNG",
          marketId,
          periodRef: weekRef,
        });
        const res = await fetch(`/api/forms/entries/week?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          setStatus("error");
          setErrorMsg("Serverfehler beim Laden");
          return;
        }

        const json = await res.json();
        if (json?.ok === false) {
          setStatus("error");
          setErrorMsg(json.error ?? "Fehler beim Laden");
          return;
        }

        const e: WeekEntry[] = Array.isArray(json.entries)
          ? json.entries
          : [];

        setEntries(e);
        setStatus(e.length > 0 ? "ok" : "empty");
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("woech-doku load error", err);
          setStatus("error");
          setErrorMsg("Netzwerkfehler beim Laden");
        }
      }
    }

    load();
    return () => controller.abort();
  }, [marketId, weekRef]);

  const weekLabel = useMemo(() => formatWeekLabel(weekRef), [weekRef]);

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Dokumentation · Metzgerei · wöchentliche Reinigung
          </h1>
          <p className="text-sm opacity-70">
            Wochenübersicht – nur lesen. Daten kommen aus der wöchentlichen
            Eingabemaske in der Metzgerei.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setWeekRef((prev) => shiftWeekRef(prev, -1))}
          >
            ◀
          </button>
          <span className="text-sm font-medium w-40 text-center">
            {weekLabel}
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setWeekRef((prev) => shiftWeekRef(prev, +1))}
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

      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Einträge dieser Woche</h2>

        {status === "loading" && (
          <p className="text-xs opacity-70">Lade Einträge…</p>
        )}
        {status === "error" && (
          <p className="text-xs text-red-600">
            {errorMsg ?? "Fehler beim Laden."}
          </p>
        )}
        {status === "empty" && (
          <p className="text-xs opacity-70">
            Für diese Woche liegen noch keine Einträge vor.
          </p>
        )}
        {status === "ok" && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-1">Datum</th>
                  <th className="text-left px-3 py-1">Erledigt durch</th>
                  <th className="text-left px-3 py-1">Daten</th>
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
                    <td className="px-3 py-1 max-w-[320px]">
                      <pre className="whitespace-pre-wrap break-words opacity-80">
                        {e.data ? JSON.stringify(e.data) : "Keine Daten"}
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


