// src/app/(protected)/dokumentation/metzgerei/[slug]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type MonthInstance = {
  id: string;
  status: string;
  periodRef: string;
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

export default function MetzgereiFormDokuPage() {
  const params = useParams<{ slug: string }>();
  const { selected } = useMarket();

  const slug = params?.slug;
  const [data, setData] = useState<MonthsByFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // aktuell immer aktuelles Jahr – später kann man das noch auswählbar machen
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const marketId = selected?.id;

    if (!marketId) {
      setData(null);
      setError("Kein Markt ausgewählt. Bitte oben im Kopfbereich einen Markt wählen.");
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

      {!loading && !error && data && data.months.length === 0 && (
        <p className="text-sm opacity-70">
          Für dieses Jahr wurden für dieses Formular noch keine Einträge angelegt.
        </p>
      )}

      {!loading && !error && data && data.months.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.months.map((monthBlock) => (
            <div
              key={monthBlock.month}
              className="rounded-2xl p-5 mika-card shadow block"
            >
              <h2 className="text-lg font-semibold mb-1">
                {MONTH_NAMES[monthBlock.month] || `Monat ${monthBlock.month}`}
              </h2>
              <p className="text-sm opacity-70 mb-2">
                {monthBlock.instances.length} Eintrag
                {monthBlock.instances.length === 1 ? "" : "e"} im Monat.
              </p>
              <ul className="text-xs opacity-80 space-y-1">
                {monthBlock.instances.map((inst) => (
                  <li key={inst.id}>
                    • {inst.periodRef}{" "}
                    <span className="uppercase text-[10px] ml-1">
                      {inst.status === "completed" ? "ABGESCHLOSSEN" : "OFFEN"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
