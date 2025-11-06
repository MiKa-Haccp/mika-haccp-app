"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isAdmin, getMarketId } from "@/lib/currentContext";
import { useMyMarkets } from "@/hooks/useMyMarkets";

export default function NavBar() {
  const [admin, setAdmin] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { markets, loading } = useMyMarkets();

  useEffect(() => {
    (async () => {
      setAdmin(await isAdmin());
      setActive(await getMarketId());
    })();
  }, []);

  const onSelect = (marketId: string) => {
    try { localStorage.setItem("activeMarketId", marketId); } catch {}
    window.location.reload(); // neu laden, damit Context überall greift
  };

  const activeLabel = useMemo(() => {
    const found = markets.find(m => m.id === active);
    return found?.name ?? (active ?? "Kein Markt");
  }, [markets, active]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link href="/markt">Markt</Link>
          <Link href="/metzgerei">Metzgerei</Link>
          <Link href="/dokumentation">Dokumentation</Link>
          {admin && <Link href="/dokumentation/admin" className="font-semibold">Admin</Link>}
        </nav>

        {/* Admin-only Markt-Switcher (rechts) */}
        {admin && (
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70 hidden sm:inline">Markt:</span>
            <select
              className="mika-input text-sm w-56"
              disabled={loading || markets.length === 0}
              value={active ?? ""}
              onChange={(e) => onSelect(e.target.value)}
            >
              {/* Aktiver Markt zuerst zeigen (falls nicht in Liste) */}
              {active && !markets.some(m => m.id === active) && (
                <option value={active}>{activeLabel}</option>
              )}
              {markets.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}
              {!active && markets.length === 0 && <option value="">Kein Markt</option>}
            </select>
          </div>
        )}
      </div>
    </header>
  );
}

