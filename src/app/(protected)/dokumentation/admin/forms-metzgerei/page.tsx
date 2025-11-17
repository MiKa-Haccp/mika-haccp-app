"use client";

import { useEffect, useState } from "react";

type FormDef = {
  id: string;
  label: string;
  sectionKey: string | null;
  period: string | null;
  active: boolean;
};

type Status = "loading" | "ok" | "empty" | "error";

const PERIOD_OPTIONS = [
  { value: "", label: "– kein Zeitraum –" },
  { value: "day", label: "täglich" },
  { value: "week", label: "wöchentlich" },
  { value: "month", label: "monatlich" },
  { value: "quarter", label: "vierteljährlich" },
  { value: "half_year", label: "halbjährlich" },
  { value: "year", label: "jährlich" },
];

export default function MetzgereiFormsAdminPage() {
  const [items, setItems] = useState<FormDef[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formular-Status
  const [editId, setEditId] = useState<string | null>(null);
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  const [period, setPeriod] = useState<string>("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/forms/metzgerei", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const defs: FormDef[] = json?.items ?? [];
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
    setActive(true);
    setMsg(null);
  }

  function startEdit(def: FormDef) {
    setEditId(def.id);
    setId(def.id); // ID darf beim Bearbeiten nicht geändert werden
    setLabel(def.label);
    setSectionKey(def.sectionKey ?? "");
    setPeriod(def.period ?? "");
    setActive(def.active);
    setMsg(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!id || !label || !sectionKey) {
      setMsg("ID, Name und Slug sind Pflichtfelder.");
      return;
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
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setMsg(json?.error ?? "Speichern fehlgeschlagen.");
      } else {
        setMsg("Gespeichert ✔");
        await reload();
        // beim Neuanlegen Formular leeren, beim Bearbeiten bleiben die Werte stehen
        if (!editId) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("save form metzgerei error", err);
      setMsg("Serverfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold mb-1">
          Admin · Metzgerei-Formulare
        </h1>
        <p className="text-sm opacity-70">
          Hier legst du Formulare für die Metzgerei an (z.B. Wareneingang,
          tägliche/wöchentliche Reinigung). Die Einträge erscheinen dann in der
          Dokumentations-Übersicht unter <span className="font-mono">Dokumentation &gt; Metzgerei</span>.
        </p>
      </header>

      {/* Formular zum Anlegen/Bearbeiten */}
      <section className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            {editId ? "Formular bearbeiten" : "Neues Formular anlegen"}
          </h2>
          {editId && (
            <button
              type="button"
              className="text-xs underline"
              onClick={resetForm}
            >
              Neu anlegen statt bearbeiten
            </button>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-end"
        >
          <label className="text-sm">
            ID (technisch, eindeutig)
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm font-mono"
              placeholder="FORM_METZ_WE_HUHN"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={!!editId} // beim Bearbeiten nicht änderbar
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
            <span className="block text-[11px] opacity-60 mt-1">
              Wird z.B. als <code>/dokumentation/metzgerei/we-huhn</code>{" "}
              verwendet.
            </span>
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

          <label className="text-sm inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Aktiv (in der Dokumentation anzeigen)
          </label>

          <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              disabled={saving}
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
        {status === "error" && (
          <p className="text-sm text-red-600">
            {errorMsg ?? "Fehler beim Laden."}
          </p>
        )}
        {status === "empty" && (
          <p className="text-sm opacity-70">Noch keine Formulare angelegt.</p>
        )}
        {status === "ok" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Slug</th>
                  <th className="text-left px-3 py-2">Zeitraum</th>
                  <th className="text-left px-3 py-2">Aktiv</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((def) => (
                  <tr key={def.id} className="border-t">
                    <td className="px-3 py-1 font-mono">{def.id}</td>
                    <td className="px-3 py-1">{def.label}</td>
                    <td className="px-3 py-1 font-mono">
                      {def.sectionKey ?? <span className="opacity-60">–</span>}
                    </td>
                    <td className="px-3 py-1">
                      {def.period ?? <span className="opacity-60">–</span>}
                    </td>
                    <td className="px-3 py-1">
                      {def.active ? "✔" : <span className="opacity-60">inaktiv</span>}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <button
                        type="button"
                        className="rounded border px-3 py-1 text-[11px]"
                        onClick={() => startEdit(def)}
                      >
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
