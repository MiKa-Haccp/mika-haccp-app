"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getMarketId, isAdmin } from "@/lib/currentContext";

type Row = {
  id?: string;
  tempId?: string;            // stabiler Key für Render
  market_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  enabled: boolean;
  _isNew?: boolean;
};

function makeTempId() {
  return typeof crypto !== "undefined" && (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DokuAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [marketId, setMarketId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | "new" | null>(null);

  const canEditGlobal = admin;             // globale Sektionen nur für Admins
  const canEditMarket = Boolean(marketId); // Markt-Sektionen nur mit Market-Kontext

  // ------ LADEN (global + markt-spezifisch; korrekt mit .or()/.is()) ------
  const load = async () => {
    setLoading(true);

    const [mid, adm] = await Promise.all([getMarketId(), isAdmin()]);
    setMarketId(mid);
    setAdmin(adm);

    let q = supabase
      .from("doku_sections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (mid) {
      // markt-spezifische ODER globale Sektionen
      q = q.or(`market_id.eq.${mid},market_id.is.null`);
    } else {
      // nur globale, wenn kein Market-Kontext
      q = q.is("market_id", null);
    }

    const { data, error } = await q;

    if (!error) {
      setRows(
        (data || []).map((d: any) => ({
          id: d.id,
          tempId: makeTempId(), // stabiler Key pro Render-Lebenszeit
          market_id: d.market_id,
          slug: d.slug,
          title: d.title,
          subtitle: d.subtitle,
          sort_order: d.sort_order,
          enabled: d.enabled,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("doku_sections_admin_changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "doku_sections" },
        () => load()
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const globals = useMemo(() => rows.filter(r => r.market_id === null), [rows]);
  const locals  = useMemo(() => rows.filter(r => r.market_id !== null), [rows]);

  // ------ NEUE ZEILE HINZUFÜGEN ------
  const addRow = (scope: "global" | "market") => {
    if (scope === "market" && !marketId) return; // Sicherheitsnetz
    const base: Row = {
      id: undefined,
      tempId: makeTempId(),
      market_id: scope === "global" ? null : marketId!,
      slug: "",
      title: "",
      subtitle: "",
      sort_order: 100,
      enabled: true,
      _isNew: true,
    };
    setRows(prev => [...prev, base]);
  };

  // ------ SPEICHERN (Slug normieren, Upsert, RLS-konform) ------
  const saveRow = async (r: Row) => {
    setSavingId(r.id ?? "new");
    try {
      const normalizeSlug = (s: string) =>
        s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

      const slug = normalizeSlug(r.slug);
      const title = r.title.trim();

      if (!slug || !title) {
        alert("Slug und Titel sind Pflichtfelder.");
        return;
      }
      if (r.market_id === null && !canEditGlobal) {
        alert("Du darfst globale Sektionen nicht bearbeiten.");
        return;
      }
      if (r.market_id !== null && !canEditMarket) {
        alert("Du hast keinen Markt-Kontext.");
        return;
      }

      const payload = {
        id: r.id,
        market_id: r.market_id,
        slug,
        title,
        subtitle: (r.subtitle ?? "").trim() || null,
        sort_order: Number.isFinite(r.sort_order) ? r.sort_order : 100,
        enabled: !!r.enabled,
      };

      const { error } = await supabase
        .from("doku_sections")
        .upsert(payload, { onConflict: "market_id,slug" });

      if (error) {
        alert("Speichern fehlgeschlagen: " + error.message);
      } else {
        // Liste nach dem Speichern neu laden (unabhängig von Realtime)
        await load();
      }
    } finally {
      setSavingId(null);
    }
  };

  // ------ LÖSCHEN (RLS: Admin für global, Mitglied für Markt) ------
  const deleteRow = async (r: Row) => {
    if (!r.id) {
      setRows(prev => prev.filter(x => x !== r));
      return;
    }
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("doku_sections").delete().eq("id", r.id);
    if (error) {
      alert("Löschen fehlgeschlagen: " + error.message);
    } else {
      // Liste nach dem Löschen neu laden (unabhängig von Realtime)
      await load();
    }
  };

  // ------ SORTIEREN (Up/Down) ------
  const move = (list: Row[], r: Row, dir: -1 | 1) => {
    const idx = list.findIndex(x => x === r);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const a = list[idx];
    const b = list[swapIdx];

    const aNew = { ...a, sort_order: (b.sort_order ?? 100) - dir };
    const bNew = { ...b, sort_order: (a.sort_order ?? 100) + dir };

    setRows(prev => prev.map(x => x === a ? aNew : x === b ? bNew : x));

    supabase.from("doku_sections").update({ sort_order: aNew.sort_order }).eq("id", a.id!);
    supabase.from("doku_sections").update({ sort_order: bNew.sort_order }).eq("id", b.id!);
  };

  // ------ RENDER EINZELZEILE ------
  const renderRow = (r: Row, canEdit: boolean) => (
    <div key={r.id ?? r.tempId} className="rounded-xl border p-4 bg-white flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
          {r.market_id ? "Markt" : "Global"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => move(r.market_id ? locals : globals, r, -1)}
            className="text-sm border px-2 py-1 rounded disabled:opacity-50"
            disabled={!r.id}
          >
            ↑
          </button>
          <button
            onClick={() => move(r.market_id ? locals : globals, r, 1)}
            className="text-sm border px-2 py-1 rounded disabled:opacity-50"
            disabled={!r.id}
          >
            ↓
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <div className="opacity-70">Slug</div>
          <input
            className="mika-input w-full"
            value={r.slug}
            onChange={e => setRows(prev => prev.map(x => x === r ? { ...x, slug: e.target.value } : x))}
            disabled={!canEdit}
            placeholder="z. B. reinigungsplaene"
          />
        </label>
        <label className="text-sm">
          <div className="opacity-70">Titel</div>
          <input
            className="mika-input w-full"
            value={r.title}
            onChange={e => setRows(prev => prev.map(x => x === r ? { ...x, title: e.target.value } : x))}
            disabled={!canEdit}
            placeholder="z. B. Reinigungspläne"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <div className="opacity-70">Untertitel</div>
          <input
            className="mika-input w-full"
            value={r.subtitle ?? ""}
            onChange={e => setRows(prev => prev.map(x => x === r ? { ...x, subtitle: e.target.value } : x))}
            disabled={!canEdit}
            placeholder="Kurzbeschreibung"
          />
        </label>
        <label className="text-sm">
          <div className="opacity-70">Sortierung</div>
          <input
            type="number"
            className="mika-input w-full"
            value={r.sort_order}
            onChange={e => setRows(prev => prev.map(x => x === r ? { ...x, sort_order: Number(e.target.value) } : x))}
            disabled={!canEdit}
          />
        </label>
        <label className="text-sm flex items-end gap-2">
          <input
            type="checkbox"
            checked={r.enabled}
            onChange={e => setRows(prev => prev.map(x => x === r ? { ...x, enabled: e.target.checked } : x))}
            disabled={!canEdit}
          />
          <span>Aktiv</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          className="mika-btn px-4 py-2 rounded-xl disabled:opacity-50"
          onClick={() => saveRow(r)}
          disabled={!canEdit || savingId === (r.id ?? "new")}
        >
          {savingId === (r.id ?? "new") ? "Speichere..." : "Speichern"}
        </button>
        <button
          className="border px-4 py-2 rounded-xl text-red-600 disabled:opacity-50"
          onClick={() => deleteRow(r)}
          disabled={!canEdit}
        >
          Löschen
        </button>
      </div>
    </div>
  );

  // ------ PAGE RENDER ------
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mica-brand">Dokumentation – Admin</h1>
        <a href="/dokumentation" className="text-sm underline">Zur Übersicht</a>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Globale Sektionen</h2>
              <button
                className="mika-btn px-3 py-2 rounded-xl disabled:opacity-50"
                onClick={() => addRow("global")}
                disabled={!canEditGlobal}
              >
                + Neue globale Sektion
              </button>
            </div>
            {!globals.length && (
              <div className="rounded-xl border p-4 text-sm opacity-70">
                Keine globalen Sektionen. (Nur Admins können globale Bereiche anlegen.)
              </div>
            )}
            <div className="grid gap-3">{globals.map(r => renderRow(r, canEditGlobal))}</div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Markt-Sektionen</h2>
              <button
                className="mika-btn px-3 py-2 rounded-xl disabled:opacity-50"
                onClick={() => addRow("market")}
                disabled={!canEditMarket}
              >
                + Neue Markt-Sektion
              </button>
            </div>
            {!locals.length && (
              <div className="rounded-xl border p-4 text-sm opacity-70">
                Keine markt-spezifischen Sektionen. Lege welche an, um sie in der Übersicht zu sehen.
              </div>
            )}
            <div className="grid gap-3">{locals.map(r => renderRow(r, canEditMarket))}</div>
          </section>
        </>
      )}
    </main>
  );
}
