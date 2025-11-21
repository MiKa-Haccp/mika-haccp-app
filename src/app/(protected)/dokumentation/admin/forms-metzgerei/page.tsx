"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarket } from "@/components/MarketProvider";
import { useMyMarkets } from "@/hooks/useMyMarkets";

type FormDef = {
  id: string;
  tenantId: string;
  label: string;
  sectionKey: string | null;
  period: string | null;
  active: boolean;
  template?: string | null;
  marketId?: string | null;
  updatedAt?: string;
};

type Status = "loading" | "ok" | "empty" | "error";
type Scope = "global" | "market";

const PERIOD_OPTIONS = [
  { value: "", label: "– kein Zeitraum –" },
  { value: "day", label: "täglich" },
  { value: "week", label: "wöchentlich" },
  { value: "month", label: "monatlich" },
  { value: "quarter", label: "vierteljährlich" },
  { value: "half_year", label: "halbjährlich" },
  { value: "year", label: "jährlich" },
];

const TEMPLATE_OPTIONS = [
  { value: "generic_check", label: "Einfaches Häkchenformular" },
  { value: "cleaning_basic", label: "Reinigung (Checkliste)" },
  { value: "wareneingang", label: "Wareneingang" },
  { value: "simple_list", label: "Einfache Liste" },
];

export default function MetzgereiFormsAdminPage() {
  const { selected } = useMarket(); // aktueller Markt aus der Navbar
  const { markets } = useMyMarkets();

  const [items, setItems] = useState<FormDef[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formular-UI-State
  const [editId, setEditId] = useState<string | null>(null);
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  const [period, setPeriod] = useState<string>("");
  const [template, setTemplate] = useState<string>("generic_check");
  const [active, setActive] = useState(true);
  const [scope, setScope] = useState<Scope>("global"); // << NEU
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedMarketId = selected?.id ?? null;
  const selectedMarketName = selected?.name ?? "—";

  const scopeLabel = useMemo(() => {
    return scope === "global"
      ? "Global (alle Märkte)"
      : selectedMarketId
      ? `Nur im Markt: ${selectedMarketName}`
      : "Nur im Markt: (bitte oben in der Navbar wählen)";
  }, [scope, selectedMarketId, selectedMarketName]);

  async function reload() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/forms/metzgerei", { cache: "no-store" });
      const text = await res.text();
      const json = text ? JSON.parse(text) : { ok: false, items: [] };
      if (!res.ok || json.ok === false) throw new Error(json?.error || text || "Request failed");
      const defs: FormDef[] = json.items ?? [];
      setItems(defs);
      setStatus(defs.length ? "ok" : "empty");
    } catch (err) {
      console.error("load forms metzgerei error", err);
      setStatus("error");
      setErrorMsg("Konnte Formulare nicht laden.");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function resetForm() {
    setEditId(null);
    setId("");
    setLabel("");
    setSectionKey("");
    setPeriod("");
    setTemplate("generic_check");
    setActive(true);
    setScope("global");
    setMsg(null);
  }

  function startEdit(def: FormDef) {
    setEditId(def.id);
    setId(def.id);
    setLabel(def.label);
    setSectionKey(def.sectionKey ?? "");
    setPeriod(def.period ?? "");
    setTemplate(def.template ?? "generic_check");
    setActive(def.active);
    setScope(def.marketId ? "market" : "global");
    setMsg(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!id || !label || !sectionKey) {
      setMsg("ID, Name und Slug sind Pflichtfelder.");
      return;
    }

    // Scope-Validierung
    let marketIdToSend: string | null = null;
    if (scope === "market") {
      if (!selectedMarketId) {
        setMsg("Bitte oben in der Navbar einen Markt wählen oder Scope = Global setzen.");
        return;
      }
      marketIdToSend = selectedMarketId;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/forms/metzgerei", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          label,
          sectionKey,
          period: period || null,
          active,
          template,
          marketId: marketIdToSend, // << NEU: Scope wird angewandt
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : { ok: false };
      if (!res.ok || json.ok === false) throw new Error(json?.error || text || "Speichern fehlgeschlagen.");
      setMsg("Gespeichert ✔");
      await reload();
      if (!editId) resetForm();
    } catch (err: any) {
      console.error("save form metzgerei error", err);
      setMsg(err?.message || "Serverfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  function marketNameFromId(mid?: string | null) {
    if (!mid) return "Global";
    const m = markets.find((x) => x.id === mid);
    return m?.name || mid;
  }

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Admin · Metzgerei-Formulare</h1>
        <p className="text-sm opacity-70">
          Aktueller Markt (aus Navbar):{" "}
          <span className="font-medium">{selectedMarketId ? selectedMarketName : "— (global ausgewählt)"}</span>
        </p>
      </header>

      {/* Formular zum Anlegen/Bearbeiten */}
      <section className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            {editId ? "Formular bearbeiten" : "Neues Formular anlegen"}
          </h2>
          {editId && (
            <button type="button" className="text-xs underline" onClick={resetForm}>
              Neu anlegen statt bearbeiten
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end">
          <label className="text-sm">
            ID (technisch, eindeutig)
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm font-mono"
              placeholder="FORM_METZ_WE_HUHN"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={!!editId}
              required
            />
          </label>

          <label className="text-sm">
            Name / Bezeichnung
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="Metzgerei – WE Hühnerbein"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </label>

          <label className="text-sm">
            Slug / sectionKey (für URL)
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm font-mono"
              placeholder="we-huhn"
              value={sectionKey}
              onChange={(e) => setSectionKey(e.target.value)}
              required
            />
          </label>

          <label className="text-sm">
            Zeitraum / Häufigkeit
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            Formular-Typ
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Scope-Auswahl */}
          <fieldset className="text-sm space-y-1">
            <legend className="font-medium">Scope</legend>
            <div className="flex flex-col gap-1">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="global"
                  checked={scope === "global"}
                  onChange={() => setScope("global")}
                />
                Global (für alle Märkte sichtbar)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  value="market"
                  checked={scope === "market"}
                  onChange={() => setScope("market")}
                />
                Nur im ausgewählten Markt
                <span className="px-2 py-0.5 text-xs rounded bg-gray-100 border ml-1">
                  {selectedMarketId ? selectedMarketName : "bitte Markt oben wählen"}
                </span>
              </label>
            </div>
            <p className="text-[11px] opacity-60">{scopeLabel}</p>
          </fieldset>

          <label className="text-sm inline-flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Aktiv (in der Dokumentation anzeigen)
          </label>

          <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              disabled={saving || (scope === "market" && !selectedMarketId)}
              title={scope === "market" && !selectedMarketId ? "Bitte oben in der Navbar einen Markt wählen" : ""}
            >
              {saving ? "Speichere…" : editId ? "Änderungen speichern" : "Anlegen"}
            </button>
            {msg && <span className="text-xs opacity-80">{msg}</span>}
          </div>
        </form>
      </section>

      {/* Tabelle der vorhandenen Formulare */}
      <section className="rounded-2xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Vorhandene Formulare</h2>
        {status === "loading" && <p className="text-sm">Lade…</p>}
        {status === "error" && <p className="text-sm text-red-600">{errorMsg ?? "Fehler beim Laden."}</p>}
        {status === "empty" && <p className="text-sm opacity-70">Noch keine Formulare angelegt.</p>}
        {status === "ok" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Slug</th>
                  <th className="text-left px-3 py-2">Zeitraum</th>
                  <th className="text-left px-3 py-2">Typ</th>
                  <th className="text-left px-3 py-2">Scope</th>
                  <th className="text-left px-3 py-2">Geändert</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((def) => (
                  <tr key={def.id} className="border-t">
                    <td className="px-3 py-1 font-mono">{def.id}</td>
                    <td className="px-3 py-1">{def.label}</td>
                    <td className="px-3 py-1 font-mono">{def.sectionKey ?? <span className="opacity-60">–</span>}</td>
                    <td className="px-3 py-1">{def.period ?? <span className="opacity-60">–</span>}</td>
                    <td className="px-3 py-1">{def.template ?? <span className="opacity-60">generic_check</span>}</td>
                    <td className="px-3 py-1">
                      {def.marketId ? (
                        <>
                          <span className="rounded bg-blue-50 border px-2 py-0.5">Markt</span>{" "}
                          <span className="opacity-70">{marketNameFromId(def.marketId)}</span>
                        </>
                      ) : (
                        <span className="rounded bg-gray-50 border px-2 py-0.5">Global</span>
                      )}
                    </td>
                    <td className="px-3 py-1">
                      {def.updatedAt ? new Date(def.updatedAt).toLocaleString() : <span className="opacity-60">–</span>}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <button type="button" className="rounded border px-3 py-1 text-[11px]" onClick={() => startEdit(def)}>
                        Bearbeiten
                      </button>
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
