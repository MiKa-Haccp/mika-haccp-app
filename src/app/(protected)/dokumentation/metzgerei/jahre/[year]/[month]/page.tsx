// src/app/(protected)/dokumentation/metzgerei/jahre/[year]/[month]/page.tsx
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

export default function MetzgereiDokuMonthPage() {
  const params = useParams<{ year: string; month: string }>();
  const yearParam = params?.year;
  const monthParam = params?.month;

  const [marketName, setMarketName] = useState<string | null>(null);
  const [instances, setInstances] = useState<MonthInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yearParam || !monthParam) return;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const marketRes = await fetch("/api/market/current", {
          cache: "no-store",
        });
        if (!marketRes.ok) {
          throw new Error("Markt konnte nicht geladen werden");
        }

        const marketData: MarketResponse = await marketRes.json();
        const m = marketData.myMarket;

        if (!m?.id) {
          setError(
            "Kein Markt ausgewählt. Bitte oben im Kopfbereich einen Markt wählen.",
          );
          setLoading(false);
          return;
        }

        setMarketName(m.name);

        const res = await fetch(
          `/api/doku/metzgerei/${yearParam}/months`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("Monatsdaten konnten nicht geladen werden");

        const json: MonthsResponse = await res.json();
        const monthNum = Number(monthParam);
        const monthBlock = json.months.find((mb) => mb.month === monthNum);

        setInstances(monthBlock?.instances ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [yearParam, monthParam]);

  const year = Number(yearParam);
  const monthNum = Number(monthParam);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-1">
        <span className="mika-brand">Metzgerei – Monat</span>
      </h1>
      <p className="text-sm opacity-80 mb-1">
        {MONTH_NAMES[monthNum] || `Monat ${monthNum}`} {year}
      </p>
      {marketName && (
        <p className="text-sm opacity-70 mb-4">
          Markt: <span className="font-semibold">{marketName}</span>
        </p>
      )}

      <p className="text-xs mb-3">
        <Link
          href={`/dokumentation/metzgerei/jahre/${year}`}
          className="underline"
        >
          &larr; Zur Jahresübersicht
        </Link>
      </p>

      {loading && <p>Lade Monatsdokumentation…</p>}
      {error && (
        <p className="text-sm text-red-600 mb-4">
          Fehler: {error}
        </p>
      )}

      {!loading && !error && instances.length === 0 && (
        <p className="text-sm opacity-70">
          Für diesen Monat wurden noch keine Formblätter ausgefüllt.
        </p>
      )}

      {!loading && !error && instances.length > 0 && (
        <ul className="space-y-2 text-sm">
          {instances.map((inst) => (
            <li key={inst.id} className="rounded-lg border p-3">
              <div className="font-semibold">{inst.definitionName}</div>
              <div className="text-xs mt-1">
                Status:{" "}
                <span className="uppercase">
                  {inst.status === "completed" ? "ABGESCHLOSSEN" : "OFFEN"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

