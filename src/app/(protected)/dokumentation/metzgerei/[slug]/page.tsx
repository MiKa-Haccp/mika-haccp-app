"use client";

import { use, useEffect, useMemo, useState } from "react";

type FormDef = {
  id: string;
  sectionKey: string | null;
  label: string;
  period: string | null;
};

type MonthEntry = {
  id: string;
  date: string; // ISO
  completedBy: string | null;
  signatureType: string | null;
  signatureMeta: any;
  data: any;
};

type Status = "loading" | "ok" | "empty" | "error";

function getDaysInMonth(periodRef: string) {
  const [yStr, mStr] = periodRef.split("-");
  const year = Number(yStr);
  const month = Number(mStr); // 1–12
  return new Date(year, month, 0).getDate();
}

function shiftPeriod(periodRef: string, deltaMonths: number): string {
  const [yStr, mStr] = periodRef.split("-");
  let year = Number(yStr);
  let month = Number(mStr);

  month += deltaMonths;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}`;
}

export default function MetzgereiDokuDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16: params via use(...) entpacken
  const { slug } = use(props.params);

  const today = new Date();
  const initialPeriodRef = today.toISOString().slice(0, 7); // YYYY-MM

  const [marketId, setMarketId] = useState<string | null>(null);
  const [periodRef, setPeriodRef] = useState(initialPeriodRef);

  const [status, setStatus] = useState<Status>("loading");
  const [daysDone, setDaysDone] = useState<number[]>([]);
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formDef, setFormDef] = useState<FormDef | null>(null);
  const [defLoadStatus, setDefLoadStatus] =
    useState<"loading" | "ok" | "error">("loading");

  // aktiven Markt holen
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
    } catch {
      // ignore
    }
  }, []);

  // FormDefinition für diesen slug laden
  useEffect(() => {
    let cancelled = false;
    async function loadDef() {
      setDefLoadStatus("loading");
      try {
        const res = await fetch("/api/doku/metzgerei/defs", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const json = await res.json();
        const defs: FormDef[] = json?.items ?? [];

        const def =
          defs.find((d) => (d.sectionKey || d.id) === slug) ?? null;

        if (!cancelled) {
          if (!def) {
            setDefLoadStatus("error");
            setErrorMsg("Formular-Definition nicht gefunden.");
          } else {
            setFormDef(def);
            setDefLoadStatus("ok");
            setErrorMsg(null);
          }
        }
      } catch (err) {
        console.error("load metzgerei def error", err);
        if (!cancelled) {
          setDefLoadStatus("error");
          setErrorMsg("Konnte Formular-Definition nicht laden.");
        }
      }
    }

    loadDef();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Daten laden, wenn Markt oder Monat wechselt und FormDef da ist
  useEffect(() => {
    if (!marketId || !formDef) {
      setStatus("empty");
      setDaysDone([]);
      setEntries([]);
      return;
    }

    const controller = new AbortController();

    async function loadEntries() {
      setStatus("loading");
      setErrorMsg(null);

      try {
        const params = new URLSearchParams({
          definitionId: formDef.id,
          marketId,
          periodRef,
        });
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
        if (!json?.ok && json?.ok !== undefined) {
          setStatus("error");
          setErrorMsg(json.error ?? "Fehler beim Laden");
          return;
        }

        const d: number[] = Array.isArray(json.days) ? json.days : [];
        const e: MonthEntry[] = Array.isArray(json.entries)
          ? json.entries
          : [];

        setDaysDone(d);
        setEntries(e);
        setStatus(e.length > 0 ? "ok" : "empty");
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("load month doku error", err);
          setStatus("error");
          setErrorMsg("Netzwerkfehler beim Laden");
        }
      }
    }

    loadEntries();
    return () => controller.abort();
  }, [marketId, periodRef, formDef]);

  const daysInMonth = useMemo(() => getDaysInMonth(periodRef), [periodRef]);
  const [year, month] = periodRef.split("-");
  const titleLabel = useMemo(
    () =>
      new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
        "de-DE",
        {
          month: "long",
          year: "numeric",
        }
      ),
    [year, month]
  );

  const doneSet = useMemo(
    () => new Set(daysDone ?? []),
    [daysDone]
  );

  const label = formDef?.label ?? `Metzgerei · ${slug}`;

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Dokumentation · {label}
          </h1>
          <p className="text-sm opacity-70">
            Monatsübersicht – nur lesen. Daten kommen aus der jeweiligen
            Eingabemaske in der Metzgerei.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setPeriodRef((prev) => shiftPeriod(prev, -1))}
          >
            ◀
          </button>
          <span className="text-sm font-medium w-40 text-center">
            {titleLabel}
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setPeriodRef((prev) => shiftPeriod(prev, +1))}
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

      {defLoadStatus === "loading" && (
        <p className="text-sm opacity-70">Lade Formular-Definition…</p>
      )}
      {defLoadStatus === "error" && (
        <p className="text-sm text-red-600">
          {errorMsg ?? "Fehler beim Laden der Definition."}
        </p>
      )}

      {/* Kalender-ähnliche Übersicht */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">
          Erledigte Tage im Monat
        </h2>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const done = doneSet.has(day);
            return (
              <div
                key={day}
                className={`flex items-center justify-center rounded border py-2 ${
                  done
                    ? "bg-emerald-100 border-emerald-400"
                    : "bg-white"
                }`}
              >
                <span className="font-medium">{day}</span>
              </div>
            );
          })}
        </div>
        {status === "loading" && (
          <p className="mt-3 text-xs opacity-70">Lade Einträge…</p>
        )}
        {status === "empty" && (
          <p className="mt-3 text-xs opacity-70">
            Für diesen Monat liegen noch keine Einträge vor.
          </p>
        )}
        {status === "error" && (
          <p className="mt-3 text-xs text-red-600">
            {errorMsg ?? "Fehler beim Laden."}
          </p>
        )}
      </section>

      {/* Detailtabelle der Einträge */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Detailansicht</h2>
        {entries.length === 0 ? (
          <p className="text-xs opacity-70">
            Keine Einträge in diesem Monat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-1">Datum</th>
                  <th className="text-left px-3 py-1">Erledigt durch</th>
                  <th className="text-left px-3 py-1">
                    Bemerkungen / Daten
                  </th>
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
                        {e.data
                          ? JSON.stringify(e.data)
                          : "Keine Daten"}
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
