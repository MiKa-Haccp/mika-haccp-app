"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type YearResponse = {
  years: number[];
};

type MarketResponse = {
  myMarket?: {
    id: string;
    name: string;
  };
};

export default function MetzgereiJahrePage() {
  const [marketName, setMarketName] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // 1) Markt laden
        const marketRes = await fetch("/api/market", { cache: "no-store" });
        if (!marketRes.ok) throw new Error("Markt konnte nicht geladen werden");
        const marketData: MarketResponse = await marketRes.json();
        const m = marketData.myMarket;
        if (!m?.id) {
          setError("Kein Markt gewählt. Bitte oben im Kopfbereich einen Markt auswählen.");
          setLoading(false);
          return;
        }
        setMarketName(m.name);

        // 2) Jahre laden
        const yearsRes = await fetch(
          `/api/doku/metzgerei/years?marketId=${encodeURIComponent(m.id)}`,
          { cache: "no-store" }
        );
        if (!yearsRes.ok) throw new Error("Jahre konnten nicht geladen werden");
        const data: YearResponse = await yearsRes.json();
        setYears(data.years || []);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-2">
        <span className="mika-brand">Metzgerei – Archiv</span>
      </h1>
      {marketName && (
        <p className="text-sm opacity-70 mb-4">
          Markt: <span className="font-semibold">{marketName}</span>
        </p>
      )}

      <p className="text-xs mb-3">
        <Link href="/dokumentation/metzgerei" className="underline">
          &larr; Zur Metzgerei-Übersicht
        </Link>
      </p>

      {loading && <p>Lade Dokumentation…</p>}
      {error && (
        <p className="text-sm text-red-600 mb-4">
          Fehler: {error}
        </p>
      )}

      {!loading && !error && years.length === 0 && (
        <p className="text-sm opacity-70">
          Es wurden noch keine Monatsformulare für diesen Markt angelegt.
        </p>
      )}

      {!loading && !error && years.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {years.map((year) => (
            <Link
              key={year}
              href={`/dokumentation/metzgerei/jahre/${year}`}
              className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold">
                Jahr {year}
              </h2>
              <p className="text-sm opacity-70">
                Übersicht aller Metzgerei-Formblätter in {year}.
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
