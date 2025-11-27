"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Entry = {
  id: string;
  date: string;
  data: any;
  initials: string | null;
  signatureMeta: any;
  createdAt: string;
};

type InstanceResponse = {
  id: string;
  year: number | null;
  month: number | null;
  definition: {
    id: string;
    name: string;
  };
  entries: Entry[];
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

export default function MetzgereiDokuInstanceDetailPage() {
  const params = useParams<{
    year: string;
    month: string;
    instanceId: string;
  }>();

  const year = Number(params?.year);
  const month = Number(params?.month);
  const instanceId = params?.instanceId;

  const [marketName, setMarketName] = useState<string | null>(null);
  const [data, setData] = useState<InstanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceId) return;
    async function load() {
      try {
        const marketRes = await fetch("/api/market", { cache: "no-store" });
        if (!marketRes.ok) throw new Error("Markt konnte nicht geladen werden");
        const marketData: MarketResponse = await marketRes.json();
        const m = marketData.myMarket;
        if (!m?.id) throw new Error("Kein Markt ausgewählt");
        setMarketName(m.name);

        const res = await fetch(
          `/api/doku/metzgerei/instances/${instanceId}?marketId=${encodeURIComponent(
            m.id
          )}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Formblatt konnte nicht geladen werden");
        const json: InstanceResponse = await res.json();
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
  }, [instanceId]);

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
        <p className="text-sm opacity-70 mb-3">
          Markt: <span className="font-semibold">{marketName}</span>
        </p>
      )}

      <p className="text-xs mb-3">
        <Link
          href={`/dokumentation/metzgerei/jahre/${year}/${month}`}
          className="underline"
        >
          &larr; Zur Formularliste im Monat
        </Link>
      </p>

      {loading && <p>Lade Formblatt…</p>}
      {error && (
        <p className="text-sm text-red-600 mb-4">
          Fehler: {error}
        </p>
      )}

      {!loading && !error && data && (
        <>
          <section className="mb-4">
            <h2 className="text-lg font-semibold mb-1">
              {data.definition.name}
            </h2>
            <p className="text-xs opacity-70">
              Instanz-ID: <code className="text-[10px]">{data.id}</code>
            </p>
          </section>

          {data.entries.length === 0 && (
            <p className="text-sm opacity-70">
              Für dieses Formblatt liegen noch keine Einträge vor.
            </p>
          )}

          {data.entries.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Datum
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Inhalt
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Kürzel
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Erfasst am
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 rounded p-2 max-h-48 overflow-auto">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {entry.initials ?? "–"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString("de-DE")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
