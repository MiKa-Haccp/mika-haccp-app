// src/app/(protected)/dokumentation/metzgerei/forms/[formId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMarket } from "@/components/MarketProvider";

type DayInfo = {
  date: string; // YYYY-MM-DD
  hasEntry: boolean;
  entryId: string | null;
  instanceId: string | null;
  data: any | null;
};

type ArchiveMonth = {
  year: number;
  month: number;
};

type ApiResponse = {
  definition: {
    id: string;
    label: string;
    period: string | null;
    marketId: string | null;
  };
  marketName: string | null;
  current: {
    year: number;
    month: number;
    days: DayInfo[];
  };
  archiveMonths: ArchiveMonth[];
};

function formatMonthLabel(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

// <- HIER die Helferfunktion einfügen
function formatDataSummary(data: any): string {
  if (!data) return "";
  if (typeof data !== "object") return String(data);

  // dataJson ist i.d.R. ein Objekt mit Schlüsseln, z.B. { temp: 3, zustand: "i.O." }
  const entries = Object.entries(data as Record<string, any>);
  if (!entries.length) return "";

  // Erste 3 Schlüssel anzeigen
  const parts = entries.slice(0, 3).map(([key, value]) => {
    if (typeof value === "boolean") {
      return `${key}: ${value ? "ja" : "nein"}`;
    }
    if (typeof value === "number") {
      return `${key}: ${value.toString().replace(".", ",")}`;
    }
    return `${key}: ${String(value)}`;
  });

  let result = parts.join(", ");
  if (entries.length > 3) {
    result += " …";
  }
  return result;
}

export default function MetzgereiFormDokuPage() {
  // WICHTIG: hier "formId", weil dein Ordner [formId] heißt
  const { formId } = useParams<{ formId: string }>();
  const { selected } = useMarket();

  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!formId) return;

      // Markt ist wichtig, sonst würden wir alles über alle Märkte mischen
      if (!selected?.id) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          definitionId: String(formId), // formId hier als definitionId an API
          marketId: selected.id,
          year: String(year),
          month: String(month),
        });

        const res = await fetch(
          `/api/doku/metzgerei/form-detail?${params.toString()}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(
            json?.error ?? "Form-Dokumentation konnte nicht geladen werden."
          );
        }

        const json: ApiResponse = await res.json();
        if (cancelled) return;
        setData(json);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [formId, selected?.id, year, month]);

  const hasMarket = !!selected?.id;
  const days = data?.current.days ?? [];
  const archiveMonths = data?.archiveMonths ?? [];

  const activeMonthLabel = formatMonthLabel(year, month);

  const olderMonths = archiveMonths.filter(
    (m) => !(m.year === year && m.month === month)
  );

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-2">
        <span className="mika-brand">Dokumentation Metzgerei</span>
      </h1>

      <p className="text-xs mb-2">
        <Link href="/dokumentation/metzgerei" className="underline">
          &larr; Zur Metzgerei-Dokumentationsübersicht
        </Link>
      </p>

      <p className="text-sm mb-1">
        Formular:{" "}
        <span className="font-semibold">{data?.definition.label ?? "–"}</span>
      </p>
      <p className="text-sm mb-1">
        Markt:{" "}
        <span className="font-semibold">
          {selected?.name ?? "Kein Markt ausgewählt"}
        </span>
      </p>
      <p className="text-sm opacity-70 mb-4">
        Aktueller Zeitraum: {activeMonthLabel}
      </p>

      {!hasMarket && (
        <p className="text-sm text-amber-700 mb-4">
          Bitte oben im Kopfbereich einen Markt wählen, um die
          Form-Dokumentation zu sehen.
        </p>
      )}

      {hasMarket && loading && <p>Lade Form-Dokumentation…</p>}

      {hasMarket && !loading && error && (
        <p className="text-sm text-red-600 mb-4">Fehler: {error}</p>
      )}

      {hasMarket && !loading && !error && (
        <>
          {/* Aktueller Monat */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              Einträge im {activeMonthLabel}
            </h2>
            {days.length === 0 && (
              <p className="text-sm opacity-70">
                Für diesen Monat liegen keine Einträge vor.
              </p>
            )}
            {days.length > 0 && (
              <div className="rounded-2xl border overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Datum</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Inhalt</th>
                      <th className="text-left px-3 py-2">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((d) => {
                      const dateObj = new Date(d.date + "T00:00:00Z");
                      const dateLabel = dateObj.toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      });
                      return (
                        <tr key={d.date} className="border-t">
                          <td className="px-3 py-1">{dateLabel}</td>
                          <td className="px-3 py-1">
                            {d.hasEntry ? (
                              <span className="text-green-700 font-medium">
                                erfasst
                              </span>
                            ) : (
                              <span className="opacity-60">offen</span>
                            )}
                          </td>
                          <td className="px-3 py-1">
                            {d.hasEntry && d.data ? (
                              <span className="text-[11px]">
                                {formatDataSummary(d.data)}
                              </span>
                            ) : (
                              <span className="text-[11px] opacity-40">
                                –
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1">
                            {d.hasEntry && d.instanceId ? (
                              <Link
                                href={`/metzgerei/instance/${d.instanceId}`}
                                className="inline-block rounded border px-3 py-1 text-[11px]"
                              >
                                Öffnen
                              </Link>
                            ) : (
                              <span className="text-[11px] opacity-40">
                                –
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Archiv */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Frühere Monate</h2>
            {olderMonths.length === 0 && (
              <p className="text-sm opacity-70">
                Es liegen noch keine früheren Monate mit Einträgen vor.
              </p>
            )}
            {olderMonths.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {olderMonths.map((m) => {
                  const label = formatMonthLabel(m.year, m.month);
                  const isActive = m.year === year && m.month === month;
                  return (
                    <button
                      key={`${m.year}-${m.month}`}
                      type="button"
                      onClick={() => {
                        setYear(m.year);
                        setMonth(m.month);
                      }}
                      className={`px-3 py-1 rounded-2xl border text-xs ${
                        isActive
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

