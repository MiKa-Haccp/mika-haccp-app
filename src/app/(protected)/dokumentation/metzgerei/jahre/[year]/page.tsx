// src/app/(protected)/dokumentation/metzgerei/jahre/[year]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type MonthInstance = {
  id: string;
  definitionId: string;
  definitionName: string;
  status: "open" | "completed";
};

type MonthsResponse = {
  year: number;
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

export default function MetzgereiDokuYearPage() {
  const params = useParams<{ year: string }>();
  const yearParam = params?.year;

  const [marketName, setMarketName] = useState<string | null>(null);
  const [data, setData] = useState<MonthsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yearParam) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) Aktuellen Markt laden
        const marketRes = await fetch("/api/market/current", {
          cache: "no-store",
        });
        if (!marketRes.ok) {
          throw new Error("Markt konnte nicht geladen werden");
        }

        const marketData: MarketResponse = await marketRes.json();
        const m = marketData.myMarket;
        if (!m?.id) {
          throw new Error("Kein Markt ausgewählt");
        }
        setMarketName(m.name);

        // 2) Monatsübersicht für dieses Jahr + Markt laden
        const res = await fetch(
          `/api/doku/metzgerei/${yearParam}/months?marketId=${encodeURIComponent(
            m.id
          )}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error("Monate konnten nicht geladen werden");
        }

        const json: MonthsResponse = await res.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [yearParam]);

  const year = data?.year ?? Number(yearParam);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-1">
        <span className="mika-brand">Metzgerei – Archiv</span>
      </h1>
      <p className="text-sm opacity-80 mb-1">
        Jahr: <span className="font-semibold">{year}</span>
      </p>
      {marketName && (
        <p className="text-sm opacity-70 mb-4">
          Markt: <span className="font-semibold">{marketName}</span>
        </p>
      )}

      <p className="text-xs mb-3">
        <Link href="/dokumentation/metzgerei/jahre" className="underline">
          &larr; Zur Jahresübersicht
        </Link>
      </p>

      {loading && <p>Lade Monatsübersicht…</p>}
      {error && (
        <p className="text-sm text-red-600 mb-4">Fehler: {error}</p>
      )}

      {!loading && !error && data && data.months.length === 0 && (
        <p className="text-sm opacity-70">
          Für dieses Jahr wurden noch keine Formblätter angelegt.
        </p>
      )}

      {!loading && !error && data && data.months.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.months.map((monthBlock) => (
            <Link
              key={monthBlock.month}
              href={`/dokumentation/metzgerei/jahre/${year}/${monthBlock.month}`}
              className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold">
                {MONTH_NAMES[monthBlock.month] ||
                  `Monat ${monthBlock.month}`}
              </h2>
              <p className="text-sm opacity-70 mb-2">
                {monthBlock.instances.length} Formular
                {monthBlock.instances.length === 1 ? "" : "e"} im Monat.
              </p>
              <ul className="text-xs opacity-80 space-y-1">
                {monthBlock.instances.slice(0, 3).map((inst) => (
                  <li key={inst.id}>
                    • {inst.definitionName}{" "}
                    <span className="uppercase text-[10px] ml-1">
                      {inst.status === "completed"
                        ? "ABGESCHLOSSEN"
                        : "OFFEN"}
                    </span>
                  </li>
                ))}
                {monthBlock.instances.length > 3 && (
                  <li>… weitere Formularinstanzen</li>
                )}
              </ul>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
