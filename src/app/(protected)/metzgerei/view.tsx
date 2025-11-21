// src/app/(protected)/metzgerei/view.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type Def = { id: string; label: string; sectionKey?: string | null; period?: string | null; marketId: string | null; };
type Inst = { id: string; marketId: string | null; updatedAt: string; definition: { id: string; label: string; marketId: string | null } };
type Status = "loading" | "ok" | "error";

export default function View() {
  const router = useRouter();
  const { selected } = useMarket();
  const marketId = selected?.id ?? null;
  const marketName = selected?.name ?? "—";

  const [defs, setDefs] = useState<Def[]>([]);
  const [rows, setRows] = useState<Inst[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState<string | null>(null);

  const contextLabel = useMemo(() => (marketId ? `Markt: ${marketName}` : "Alle Märkte (global)"), [marketId, marketName]);

  async function reload() {
    setStatus("loading");
    setMsg(null);
    try {
      const url = marketId ? `/api/metzgerei?marketId=${encodeURIComponent(marketId)}` : `/api/metzgerei`;
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      setDefs(json?.definitions ?? []);
      setRows(json?.instances ?? []);
      setStatus("ok");
    } catch (e: any) {
      setStatus("error");
      setMsg(e?.message || "Fehler beim Laden.");
    }
  }

  useEffect(() => { reload(); }, [marketId]);

  // Neu anlegen → Instanz erzeugen & sofort öffnen (robuste JSON-Parsing)
  async function createAndOpen(defId: string) {
    if (!marketId) { setMsg("Bitte oben in der Navbar einen Markt wählen."); return; }
    setMsg(null);
    try {
      const res = await fetch("/api/metzgerei", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definitionId: defId, marketId }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok || json?.error || !json?.id) throw new Error(json?.error || text || "Erzeugen fehlgeschlagen");
      router.push(`/metzgerei/instance/${json.id}`);
    } catch (e: any) {
      setMsg(e?.message || "Erzeugen fehlgeschlagen");
    }
  }

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Metzgerei</h1>
        <p className="text-sm opacity-70">Kontext: {contextLabel}</p>
      </header>

      {!marketId && (
        <div className="rounded-2xl border p-3 text-sm bg-amber-50">
          Es sind Einträge ohne Markt-Zuordnung sichtbar. Wähle oben einen Markt, um neue Instanzen anzulegen.
        </div>
      )}

      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Starten (Instanz anlegen)</h2>
        {status === "loading" && <p className="text-sm">Lade…</p>}
        {status === "error" && <p className="text-sm text-red-600">{msg || "Fehler"}</p>}
        {status === "ok" && (
          <>
            {defs.length === 0 ? (
              <p className="text-sm opacity-70">Keine aktiven Formulardefinitionen gefunden.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {defs.map((d) => (
                  <div key={d.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{d.label}</div>
                      <span className="text-[11px] rounded border px-2 py-0.5">{d.marketId ? "Markt" : "Global"}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="text-[11px] rounded border px-3 py-1"
                        onClick={() => createAndOpen(d.id)}
                        disabled={!marketId}
                        title={!marketId ? "Bitte oben einen Markt wählen" : "Instanz anlegen"}
                      >
                        Starten
                      </button>
                      <Link href="/dokumentation/metzgerei" className="text-[11px] rounded border px-3 py-1" title="In der Dokumentation ansehen">
                        Doku
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Vorhandene Instanzen</h2>
        {status === "loading" && <p className="text-sm">Lade…</p>}
        {status === "error" && <p className="text-sm text-red-600">{msg || "Fehler"}</p>}
        {status === "ok" && (
          <>
            {rows.length === 0 ? (
              <p className="text-sm opacity-70">Keine Einträge gefunden.</p>
            ) : (
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
                        <td className="px-3 py-1">{r.definition?.label ?? r.id}</td>
                        <td className="px-3 py-1">{r.definition?.marketId ? "Markt" : "Global"}</td>
                        <td className="px-3 py-1">{marketId ? (marketName || marketId) : "Ausgewählter Markt"}</td>
                        <td className="px-3 py-1">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "–"}</td>
                        <td className="px-3 py-1 text-right">
                          <Link href={`/metzgerei/instance/${r.id}`} className="rounded border px-3 py-1 text-[11px]">
                            Öffnen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
