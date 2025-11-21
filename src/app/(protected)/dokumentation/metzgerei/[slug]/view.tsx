"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type Inst = { id: string; periodRef: string; updatedAt: string; marketId: string | null; definition: { label: string; marketId: string | null } };

export default function DocDetail({ slug }: { slug: string }) {
  const { selected } = useMarket();
  const marketId = selected?.id ?? null;

  const [rows, setRows] = useState<Inst[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const url = marketId
        ? `/api/dokumentation/metzgerei?slug=${encodeURIComponent(slug)}&marketId=${encodeURIComponent(marketId)}`
        : `/api/dokumentation/metzgerei?slug=${encodeURIComponent(slug)}`;
      const text = await fetch(url, { cache: "no-store" }).then(r => r.text());
      const json = text ? JSON.parse(text) : {};
      if (!json?.ok) throw new Error(json?.error || "Fehler");
      setRows(json.instances ?? []);
    } catch (e: any) {
      setErr(e?.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug, marketId]);

  // Gruppierung nach periodRef (Monat/Woche/Tag…)
  const groups = useMemo(() => {
    const m = new Map<string, Inst[]>();
    for (const r of rows) {
      const key = r.periodRef || "—";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    // neueste zuerst
    return Array.from(m.entries()).sort((a,b) => (a[0] < b[0] ? 1 : -1));
  }, [rows]);

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dokumentation · {slug}</h1>
        <Link href="/dokumentation/metzgerei" className="text-sm underline">Zurück</Link>
      </div>

      {loading && <p className="text-sm">Lade…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && !err && (
        <>
          {groups.length === 0 && <p className="text-sm opacity-70">Keine Einträge vorhanden.</p>}

          {groups.map(([period, list]) => (
            <section key={period} className="rounded-2xl border p-4 mb-3">
              <h2 className="text-sm font-semibold mb-2">Periode: {period}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Formular</th>
                      <th className="text-left px-3 py-2">Sichtbarkeit</th>
                      <th className="text-left px-3 py-2">Geändert</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-1">{r.definition?.label ?? r.id}</td>
                        <td className="px-3 py-1">{r.definition?.marketId ? "Markt" : "Global"}</td>
                        <td className="px-3 py-1">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}</td>
                        <td className="px-3 py-1 text-right">
                          {/* fürs Erste: zur Instanz-Ansicht (Bearbeitung/Lesen) */}
                          <Link href={`/metzgerei/instance/${r.id}`} className="rounded border px-3 py-1 text-[11px]">
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
