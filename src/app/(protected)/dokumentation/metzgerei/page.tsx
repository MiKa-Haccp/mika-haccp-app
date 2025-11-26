"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type Def = { id: string; label: string; sectionKey: string | null; period: string | null; marketId: string | null };
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type Def = {
  id: string;
  label: string;
  sectionKey: string | null;
  period: string | null;
  marketId: string | null;
};

export default function MetzgereiDokuPage() {
  const { selected } = useMarket();
  const [definitions, setDefinitions] = useState<Def[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = selected?.id ? `?marketId=${selected.id}` : "";
        const res = await fetch(`/api/doku/metzgerei/defs${q}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        setDefinitions(json?.items ?? []);
      } catch {
        setDefinitions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selected?.id]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dokumentation · Metzgerei</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(definitions ?? []).map((def) => (
          <div key={def.id} className="rounded-2xl border p-4">
            <div className="text-xs opacity-60 mb-1">
              {def.marketId ? "Markt-spezifisch" : "Global"} · Zeitraum: {def.period ?? "–"}
            </div>
            <div className="font-semibold mb-2">{def.label}</div>

            {def.sectionKey && (
              <Link
                className="rounded border text-xs px-3 py-1"
                href={
                  selected?.id
                    ? `/dokumentation/metzgerei/${def.sectionKey}?marketId=${selected.id}`
                    : `/dokumentation/metzgerei/${def.sectionKey}`
                }
              >
                Öffnen
              </Link>
            )}
          </div>
        ))}
      </div>

      {!loading && !definitions?.length && (
        <p className="opacity-70 text-sm mt-4">Keine Formulare gefunden.</p>
      )}
    </main>
  );
}
