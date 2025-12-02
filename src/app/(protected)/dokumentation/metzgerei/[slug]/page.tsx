// src/app/(protected)/dokumentation/metzgerei/[slug]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type MonthInstance = {
  id: string;
  periodRef: string;
  status: "open" | "completed";
  completedBy?: string | null;
  summary?: string | null;
};

type MonthsByFormResponse = {
  sectionKey: string;
  label: string;
  year: number;
  period: string | null;
  months: {
    month: number;
    instances: MonthInstance[];
  }[];
};

type MarketResponse = {
  myMarket?: {
    id: string;
    name: string;
  };
};

const MONTH_NAMES = [
  "",
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function getDaysInMonth(year: number, month: number) {
  // month: 1–12
  return new Date(year, month, 0).getDate();
}

function formatDayLabel(day: number, month: number, year: number) {
  return `${String(day).padStart(2, "0")}.${String(month).padStart(
    2,
    "0"
  )}.${year}`;
}

export default function MetzgereiFormDokuPage() {
  const params = useParams<{ slug: string }>();
  const { selected } = useMarket();

  const slug = params?.slug;
  const [data, setData] = useState<MonthsByFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(
    () => new Date().getMonth() + 1,
    []
  );

  useEffect(() => {
    const marketId = selected?.id;

    if (!marketId) {
      setData(null);
      setError(
        "Kein Markt ausgewählt. Bitte oben im Kopfbereich einen Markt wählen."
      );
      setLoading(false);
      return;
    }

    if (!slug) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/doku/metzgerei/months-by-form?` +
            `marketId=${encodeURIComponent(marketId)}` +
            `&year=${encodeURIComponent(String(year))}` +
            `&sectionKey=${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("Monatsdaten konnten nicht geladen werden.");
        }

        const json: MonthsByFormResponse = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selected?.id, slug, year]);

  const title = data?.label ?? slug ?? "Formular";

  // Alle 12 Monate des Jahres vorbereiten, auch wenn noch keine Einträge existieren.
  const monthBlocks = useMemo(() => {
    const byMonth = new Map<number, MonthInstance[]>();

    if (data) {
      for (const mb of data.months) {
        byMonth.set(mb.month, mb.instances);
      }
    }

    const blocks: { month: number; instances: MonthInstance[] }[] =
      [];

    for (let m = 1; m <= 12; m++) {
      blocks.push({
        month: m,
        instances: byMonth.get(m) ?? [],
      });
    }

    return blocks;
  }, [data]);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-1">
        <span className="mika-brand">Metzgerei – Dokumentation</span>
      </h1>

      <p className="text-sm opacity-80 mb-1">
        Formular: <span className="font-semibold">{title}</span>
      </p>
      <p className="text-sm opacity-80 mb-1">
        Jahr: <span className="font-semibold">{year}</span>
      </p>

      {selected?.name && (
        <p className="text-sm opacity-70 mb-3">
          Markt: <span className="font-semibold">{selected.name}</span>
        </p>
      )}

      <p className="text-xs mb-4">
        <Link href="/dokumentation/metzgerei" className="underline">
          &larr; Zur Formularübersicht
        </Link>
      </p>

      {loading && <p>Lade Monatsübersicht…</p>}

      {error && (
        <p className="text-sm text-red-600 mb-4">Fehler: {error}</p>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {monthBlocks.map((monthBlock) => {
            const month = monthBlock.month;
            const name = MONTH_NAMES[month] || `Monat ${month}`;
            const daysInMonth = getDaysInMonth(year, month);

            // Instanzen nach Tag mappen
            const instByDay = new Map<number, MonthInstance>();
            for (const inst of monthBlock.instances) {
              const d = new Date(inst.periodRef);
              if (!Number.isNaN(d.getTime())) {
                const day = d.getDate();
                instByDay.set(day, inst);
              }
            }

            const totalEntries = instByDay.size;
            const isCurrent = month === currentMonth;

            return (
              <details
                key={month}
                open={isCurrent}
                className="rounded-2xl border shadow-sm"
              >
                <summary className="cursor-pointer px-5 py-3 flex items-center justify-between">
                  <span className="font-semibold">{name}</span>
                  <span className="text-xs opacity-70">
                    {totalEntries} Eintrag
                    {totalEntries === 1 ? "" : "e"}
                  </span>
                </summary>

                <div className="px-5 pb-4">
                  <table className="w-full text-xs border-t">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-2 py-1">Datum</th>
                        <th className="text-left px-2 py-1">
                          Inhalt
                        </th>
                        <th className="text-left px-2 py-1">
                          Geprüft von
                        </th>
                        <th className="text-right px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(
                        { length: daysInMonth },
                        (_, idx) => idx + 1
                      ).map((day) => {
                        const inst = instByDay.get(day);
                        const label = formatDayLabel(
                          day,
                          month,
                          year
                        );

                        return (
                          <tr key={day} className="border-t">
                            <td className="px-2 py-1 whitespace-nowrap">
                              {label}
                            </td>
                            <td className="px-2 py-1">
                              {inst ? (
                                <>
                                  <span className="mr-1">✓</span>
                                  {inst.summary ?? "Eintrag vorhanden"}
                                </>
                              ) : (
                                <span className="opacity-40">
                                  kein Eintrag
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1">
                              {inst?.completedBy ?? "–"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {inst && (
                                <Link
                                  href={`/metzgerei/instance/${inst.id}`}
                                  className="underline"
                                >
                                  Öffnen
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </main>
  );
}
