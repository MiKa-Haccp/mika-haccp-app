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

export default function MetzgereiDokuMonthInstancesPage() {
  const params = useParams<{ year: string; month: string }>();
  const yearParam = params?.year;
  const monthParam = params?.month;

  const year = Number(yearParam);
  const month = Number(monthParam);

  const [marketName, setMarketName] = useState<string | null>(null);
  const [instances, setInstances] = useState<MonthInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!yearParam || !monthParam) return;
    async function load() {
      try {
        const marketRes = await fetch("/api/market", { cache: "no-store" });
        if (!marketRes.ok) throw new Error("Markt konnte nicht geladen werden");
        const marketData: MarketResponse = await marketRes.json();
        const m = marketData.myMarket;
        if (!m?.id) throw new Error("Kein Markt ausgewählt");
        setMarketName(m.name);

        const res = await fetch(
          `/api/doku/metzgerei/${yearParam}/months?marketId=${encodeURIComponent(
            m.id
          )}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Monatsdaten konnten nicht geladen werden");
        const json: MonthsResponse = await res.json();

        const monthBlock = json.months.find(
          (mb) => mb.month === Number(monthParam)
        );
        setInstances(monthBlock?.instances ?? []);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [yearParam, monthParam]);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-1">
        <span className="mika-brand">Metzgerei – Archiv</span>
      </h1>
      <p className="text-sm opacity-80 mb-1">
        Jahr: <span className="font-semibold">{year}</span> · Monat:{" "}
        <span className="font-semibold">
          {MONTH_NAMES[month] || month}
        </span>
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
          &larr; Zur Monatsübersicht
        </Link>
      </p>

      {loading && <p>Lade Formblätter…</p>}
      {error && (
        <p className="text-sm text-red-600 mb-4">
          Fehler: {error}
        </p>
      )}

      {!loading && !error && instances.length === 0 && (
        <p className="text-sm opacity-70">
          In diesem Monat wurden noch keine Metzgerei-Formblätter angelegt.
        </p>
      )}

      {!loading && !error && instances.length > 0 && (
        <div className="space-y-3">
          {instances.map((inst) => (
            <Link
              key={inst.id}
              href={`/dokumentation/metzgerei/jahre/${year}/${month}/${inst.id}`}
              className="rounded-2xl p-4 mika-card shadow block hover:shadow-lg transition"
            >
              <h2 className="text-base font-semibold mb-1">
                {inst.definitionName}
              </h2>
              <p className="text-xs opacity-70">
                Status:{" "}
                <span className="font-semibold">
                  {inst.status === "completed" ? "Abgeschlossen" : "Offen"}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
