"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMarket } from "@/components/MarketProvider";

type FormDef = {
  id: string;
  label: string;
  sectionKey: string | null;
  period: string | null;
  active: boolean;
  marketId?: string | null;
};

type InstanceRow = {
  id: string;
  marketId: string | null;
  updatedAt: string;
  definition: { id: string; label: string; marketId: string | null };
};

type StatusItem = {
  defId: string;
  label: string;
  sectionKey: string;
  marketId: string | null;
  period: string | null;
  periodRef: string;
  done: boolean;
  updatedAt: string | null;
};

type Status = "loading" | "ok" | "empty" | "error";

export default function MetzgereiView() {
  const router = useRouter();
  const { selected } = useMarket();
  const marketId = selected?.id ?? null;

  const [defs, setDefs] = useState<FormDef[]>([]);
  const [rows, setRows] = useState<InstanceRow[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StatusItem>>({});
  const [state, setState] = useState<Status>("loading");
  const [msg, setMsg] = useState<string | null>(null);

  async function safeJson(res: Response) {
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; } catch { return null; }
  }

  async function reload() {
    setState("loading");
    setMsg(null);
    try {
      const url = marketId ? `/api/metzgerei?marketId=${encodeURIComponent(marketId)}` : `/api/metzgerei`;
      const data = await fetch(url, { cache: "no-store" }).then(safeJson);
      const defList: FormDef[] = data?.definitions ?? [];
      const instList: InstanceRow[] = data?.instances ?? [];

      // Status laden
      const sUrl = marketId
        ? `/api/metzgerei/status?marketId=${encodeURIComponent(marketId)}`
        : `/api/metzgerei/status`;
      const sData = await fetch(sUrl, { cache: "no-store" }).then(safeJson);
      const sItems: StatusItem[] = sData?.items ?? [];

      const map: Record<string, StatusItem> = {};
      for (const s of sItems) map[s.defId] = s;

      setDefs(defList);
      setRows(instList);
      setStatusMap(map);
      setState("ok");
    } catch (e: any) {
      setState("error");
      setMsg(e?.message || "Fehler beim Laden.");
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [marketId]);

  async function createAndOpen(defId: string) {
    try {
      if (!marketId) {
        alert("Bitte zuerst oben einen Markt wählen.");
        return;
      }
      const res = await fetch("/api/metzgerei", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definitionId: defId, marketId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.id) throw new Error(json?.error || "Erzeugen fehlgeschlagen");
      router.push(`/metzgerei/instance/${json.id}`);
    } catch (e: any) {
      alert(e?.message || "Fehler");
    }
  }

  const ctx = useMemo(() => {
    return marketId ? `Markt: ${selected?.name ?? marketId}` : "Global";
  }, [marketId, selected]);

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Metzgerei</h1>
        <span className="text-sm opacity-70">Kontext: {ctx}</span>
      </header>

      {/* Formulare (Neu anlegen + Statuspunkt) */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Starten (Instanz anlegen)</h2>

        {state === "loading" && <p className="text-sm">Lade…</p>}
        {state === "error" && <p className="text-sm text-red-600">{msg ?? "Fehler"}</p>}
        {state === "ok" && defs.length === 0 && (
          <p className="text-sm opacity-70">Keine Formulare gefunden.</p>
        )}

        {state === "ok" && defs.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {defs.map((d) => {
              const st = d.id ? statusMap[d.id] : undefined;
              const isDone = !!st?.done;
              return (
                <div key={d.id} className="rounded-xl border p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${isDone ? "bg-green-500" : "bg-red-500"}`}
                      title={isDone ? "Erledigt in aktueller Periode" : "Offen"}
                    />
                    <h3 className="font-medium">{d.label}</h3>
                  </div>
                  <div className="text-xs opacity-70 -mt-1">
                    {d.marketId ? "Markt-spezifisch" : "Global"} · Zeitraum: {d.period ?? "—"}
                    {st?.periodRef ? ` · ${st.periodRef}` : ""}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded border px-3 py-1 text-xs"
                      onClick={() => createAndOpen(d.id)}
                    >
                      Starten
                    </button>
                    {d.sectionKey && (
                      <Link
                        href={`/dokumentation/metzgerei/${encodeURIComponent(d.sectionKey)}`}
                        className="rounded border px-3 py-1 text-xs"
                      >
                        Doku
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Vorhandene Instanzen */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Vorhandene Instanzen</h2>
        {state === "loading" && <p className="text-sm">Lade…</p>}
        {state === "ok" && rows.length === 0 && (
          <p className="text-sm opacity-70">Keine Einträge gefunden.</p>
        )}
        {state === "ok" && rows.length > 0 && (
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
                    <td className="px-3 py-1">{r.marketId ? "Ausgewählter Markt" : "—"}</td>
                    <td className="px-3 py-1">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <Link
                        href={`/metzgerei/instance/${r.id}`}
                        className="rounded border px-3 py-1 text-[11px]"
                      >
                        Öffnen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
