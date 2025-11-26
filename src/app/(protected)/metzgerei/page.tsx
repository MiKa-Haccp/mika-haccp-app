"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarket } from "@/components/MarketProvider";

type Def = {
  id: string;
  label: string;
  sectionKey: string | null;
  period: string | null;
  marketId: string | null;
};

type Inst = {
  id: string;
  marketId: string | null;
  updatedAt: string;
  definition: { label: string; marketId: string | null };
};

export default function MetzgereiPage() {
  const { selected } = useMarket();
  const router = useRouter();

  const [defs, setDefs] = useState<Def[]>([]);
  const [rows, setRows] = useState<Inst[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const q = selected?.id ? `?marketId=${selected.id}` : "";
      const res = await fetch(`/api/metzgerei${q}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setDefs(json?.definitions ?? []);
        setRows(json?.instances ?? []);
      } else {
        setDefs([]);
        setRows([]);
      }
    } catch {
      setDefs([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function createAndOpen(defId: string) {
    if (!selected?.id) {
      alert("Bitte zuerst Markt wählen");
      return;
    }
    try {
      const res = await fetch("/api/forms/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definitionId: defId, marketId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        alert(json?.error || "Erzeugen fehlgeschlagen");
        return;
      }
      router.push(`/metzgerei/instance/${json.id}`);
    } catch {
      alert("Netzwerkfehler beim Erzeugen");
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Metzgerei</h1>
      <p className="text-sm opacity-70">
        Kontext: Markt: {selected?.name ?? "Alle Märkte (global)"}
      </p>

      {/* Definitionen (Karten) */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {defs.map((d) => (
          <div key={d.id} className="rounded-2xl border p-4">
            <div className="text-xs opacity-60 mb-1">
              {d.marketId ? "Markt-spezifisch" : "Global"} · Zeitraum: {d.period ?? "–"}
            </div>
            <div className="font-semibold mb-2">{d.label}</div>
            <div className="flex gap-2">
              {/* Starten-Button nur aktiv, wenn Markt gewählt */}
              <button
                disabled={!selected?.id}
                title={selected?.id ? "" : "Bitte zuerst Markt wählen"}
                className={`rounded text-xs px-3 py-1 ${
                  selected?.id
                    ? "bg-black text-white"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                onClick={() => selected?.id && createAndOpen(d.id)}
              >
                Starten
              </button>

              {/* Doku-Link inkl. marketId (falls vorhanden) */}
              {d.sectionKey && (
                <Link
                  className="rounded border text-xs px-3 py-1"
                  href={
                    selected?.id
                      ? `/dokumentation/metzgerei/${d.sectionKey}?marketId=${selected.id}`
                      : `/dokumentation/metzgerei/${d.sectionKey}`
                  }
                >
                  Doku
                </Link>
              )}
            </div>
          </div>
        ))}
        {!defs.length && !loading && (
          <p className="text-sm opacity-70">Keine Formulare gefunden.</p>
        )}
      </section>

      {/* Vorhandene Instanzen (Tabelle) */}
      <section className="rounded-2xl border">
        <div className="p-3 font-semibold text-sm">Vorhandene Instanzen</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Formular</th>
                <th className="text-left px-3 py-2">Sichtbarkeit</th>
                <th className="text-left px-3 py-2">Markt</th>
                <th className="text-left px-3 py-2">Geändert</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-1">{r.definition.label}</td>
                  <td className="px-3 py-1">
                    {r.definition.marketId ? "Markt" : "Global"}
                  </td>
                  <td className="px-3 py-1">
                    {r.marketId ? selected?.name ?? "Ausgewählter Markt" : "Global"}
                  </td>
                  <td className="px-3 py-1">
                    {new Date(r.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-1 text-right">
                    <Link
                      className="rounded border px-3 py-1 text-[11px]"
                      href={`/metzgerei/instance/${r.id}`}
                    >
                      Öffnen
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td className="px-3 py-2 opacity-70" colSpan={5}>
                    Keine Einträge gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
