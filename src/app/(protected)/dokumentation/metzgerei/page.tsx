"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type Item = {
  id: string;
  label: string;
  slug: string;
  period: string | null;
  marketId: string | null;
};

export default function DokuMetzgereiPage() {
  const { selected } = useMarket();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/doku/metzgerei/defs", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (alive && res.ok && json?.ok) setItems(json.items ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // wie im Hauptbereich: Global immer zeigen, dazu Markt-spezifische nur für den selektierten Markt
  const visible = useMemo(() => {
    if (!selected?.id) return items.filter(i => i.marketId === null);
    return items.filter(i => i.marketId === null || i.marketId === selected.id);
  }, [items, selected?.id]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Dokumentation · Metzgerei</h1>
      <p className="text-sm opacity-70">
        Kontext: {selected?.id ? `Markt: ${selected.name}` : "Global / alle Märkte"}
      </p>

      {!loading && visible.length === 0 && (
        <p className="text-sm opacity-70">Keine Formulare gefunden.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((it) => (
          <div key={it.id} className="rounded-2xl border p-4">
            <div className="text-xs opacity-60 mb-1">
              Sichtbarkeit: {it.marketId ? "Markt" : "Global"} · Zeitraum: {it.period ?? "–"}
            </div>
            <div className="font-semibold mb-2">{it.label}</div>
            <div className="flex gap-2">
              <Link
                className="rounded border text-xs px-3 py-1"
                href={
                  selected?.id
                    ? `/dokumentation/metzgerei/${it.slug}?marketId=${selected.id}`
                    : `/dokumentation/metzgerei/${it.slug}`
                }
              >
                Öffnen
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
