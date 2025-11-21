// src/components/MarketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Market = { id: string; name: string } | null;
type Ctx = { selected: Market; setSelected: (m: Market) => void; hydrated: boolean };

const STORAGE_KEY = "mika:selectedMarket";
const MarketContext = createContext<Ctx>({ selected: null, setSelected: () => {}, hydrated: false });
export function useMarket(){ return useContext(MarketContext); }

export default function MarketProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Market>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && raw !== "null") {
        const parsed = JSON.parse(raw);
        setSelected(parsed && typeof parsed==="object" && "id" in parsed ? parsed : null);
      } else {
        setSelected(null);
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); } catch {}
  }, [selected, hydrated]);

  const value = useMemo(() => ({ selected, setSelected, hydrated }), [selected, hydrated]);
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}
