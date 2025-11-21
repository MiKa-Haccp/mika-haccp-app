"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMarket } from "@/components/MarketProvider";

type Def = { id: string; label: string; sectionKey: string; marketId: string | null };

export default function DokuMetzgereiIndex() {
  const { selected } = useMarket();
  const marketId = selected?.id ?? null;

  const [defs, setDefs] = useState<Def[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const url = marketId ? `/api/metzgerei?marketId=${encodeURIComponent(marketId)}` : `/api/metzgerei`;
      const text = await fetch(url, { cache: "no-store" }).then(r => r.text());
      const json = text ? JSON.parse(text) : {};
      const list: Def[] = (json.definitions ?? []).map((d: any) => ({
        id: d.id, label: d.label, sectionKey: d.sectionKey, marketId: d.marketId
      }));
      setDefs(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [marketId]);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4"><span className="mika-brand">Dokumentation · Metzgerei</span></h1>
      {loading && <p className="text-sm">Lade…</p>}
      {!loading && defs.length === 0 && <p className="text-sm opacity-70">Keine Formulare gefunden.</p>}

      {!loading && defs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {defs.map((d) => (
            <Link
              key={d.id}
              href={`/dokumentation/metzgerei/${encodeURIComponent(d.sectionKey)}`}
              className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold">{d.label}</h3>
              <p className="opacity-70 text-sm">{d.marketId ? "Markt-spezifisch" : "Global"}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
