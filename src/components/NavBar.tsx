"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isAdmin } from "@/lib/currentContext";
import { useMyMarkets } from "@/hooks/useMyMarkets";
import { useMarket } from "@/components/MarketProvider";

const MP_STORAGE_KEY = "mika:selectedMarket"; // 👈 HIER definieren (Top-Level)

export default function NavBar() {
  const [admin, setAdmin] = useState(false);
  const { markets, loading } = useMyMarkets();
  const { selected, setSelected, hydrated } = useMarket();

  useEffect(() => {
    (async () => setAdmin(await isAdmin()))();
  }, []);

  const active = selected?.id ?? null;

  const onSelect = (marketId: string) => {
    try {
      if (!marketId) {
        // Global
        localStorage.removeItem("activeMarketId");
        localStorage.removeItem("currentMarketId");
        localStorage.setItem(MP_STORAGE_KEY, "null");    
        setSelected(null);
      } else {
        // Markt
        localStorage.setItem("activeMarketId", marketId);
        localStorage.setItem("currentMarketId", marketId);
        const found = markets.find((m) => m.id === marketId);
        setSelected(found ? { id: found.id, name: found.name } : { id: marketId, name: marketId });
      }
    } catch {}
    window.location.reload();
  };

  const activeLabel = useMemo(() => {
    if (!active) return "Alle Märkte (global)";
    const found = markets.find((m) => m.id === active);
    return found?.name ?? active;
  }, [markets, active]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/">Übersicht</Link>
          <Link href="/allgemein">Allgemein</Link>
          <Link href="/markt">Markt</Link>
          <Link href="/metzgerei">Metzgerei</Link>
          <Link href="/dokumentation">Dokumentation</Link>
          {admin && <Link href="/admin" className="font-semibold">Admin</Link>}
        </nav>

        {admin && (
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70 hidden sm:inline">Markt:</span>
            <select
              className="mika-input text-sm w-56"
              disabled={!hydrated || loading || markets.length === 0}
              value={active ?? ""} // "" = global
              onChange={(e) => onSelect(e.target.value)}
              title={active ? `Gewählt: ${activeLabel}` : "Alle Märkte (global)"}
            >
              {/* Global-Option */}
              <option value="">Alle Märkte (global)</option>

              {/* Unbekannter aktiver Wert (Kompatibilität) */}
              {active && !markets.some((m) => m.id === active) && (
                <option value={active}>{activeLabel}</option>
              )}

              {/* Märkte */}
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}

              {/* Fallback */}
              {!active && markets.length === 0 && <option value="">Kein Markt</option>}
            </select>
          </div>
        )}
      </div>
    </header>
  );
}
