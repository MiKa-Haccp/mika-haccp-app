"use client";

import { useEffect, useState } from "react";
import { useMarket } from "./MarketProvider";

type MarketItem = { id: string; name: string };

export default function MarketSwitcher() {
  const { selected, setSelected } = useMarket();
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/markets")
      .then(r => r.json())
      .then((list: MarketItem[]) => setMarkets(list ?? []))
      .catch(() => setMarkets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      className="rounded-xl border px-3 py-2"
      value={selected?.id ?? ""} // "" == global
      onChange={(e) => {
        const id = e.target.value;
        if (!id) {
          setSelected(null); // Global
          return;
        }
        const m = markets.find(m => m.id === id);
        setSelected(m ? { id: m.id, name: m.name } : { id, name: id });
      }}
      title={selected ? `Gewählt: ${selected.name}` : "Alle Märkte (global)"}
      disabled={loading}
    >
      <option value="">Alle Märkte (global)</option>
      {markets.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  );
}
