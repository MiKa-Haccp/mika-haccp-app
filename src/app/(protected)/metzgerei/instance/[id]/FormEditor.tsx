"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ... (Typen wie gehabt)

export default function FormEditor({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string>("");
  const [schema, setSchema] = useState<any>(null);
  const [definitionLabel, setDefinitionLabel] = useState<string>("");
  const [values, setValues] = useState<any>({});
  const [period, setPeriod] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/metzgerei/instances/${id}`, { cache: "no-store" });
      const text = await res.text();
      let json: any = null;
      if (text && !text.trim().startsWith("<")) {
        try { json = JSON.parse(text); } catch {}
      }
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Fehler (${res.status})`);

      setSchema(json.instance.definition.schemaJson);
      setDefinitionLabel(json.instance.definition.label);
      setDateISO(json.date);
      setPeriod(json.instance.definition.period ?? "none");
      setValues(json.entry?.dataJson ?? {});
    } catch (e: any) {
      setErr(e?.message || "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  function onChange(key: string, val: any) {
    setValues((prev: any) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/metzgerei/entries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instanceId: id, dateISO, data: values, status: "done" }),
      });
      const text = await res.text();
      let json: any = null;
      if (text && !text.trim().startsWith("<")) {
        try { json = JSON.parse(text); } catch {}
      }
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Fehler (${res.status})`);
      router.push("/metzgerei");
    } catch (e: any) {
      setErr(e?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  const FormBody = useMemo(() => {
    if (!schema) return null;

    if (schema.type === "checklist" && Array.isArray(schema.items)) {
      return (
        <div className="space-y-2">
          {schema.items.map((it: any) => (
            <label key={it.key} className="flex items-center gap-2">
              <input type="checkbox" checked={!!values[it.key]} onChange={(e) => onChange(it.key, e.target.checked)} />
              <span className="text-sm">{it.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (schema.type === "goods_in" && Array.isArray(schema.fields)) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {schema.fields.map((f: any) => {
            if (f.type === "boolean") {
              return (
                <label key={f.key} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!values[f.key]} onChange={(e) => onChange(f.key, e.target.checked)} />
                  <span className="text-sm">{f.label}</span>
                </label>
              );
            }
            if (f.type === "number") {
              return (
                <label key={f.key} className="text-sm">
                  {f.label}
                  <input
                    type="number"
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                    value={values[f.key] ?? ""}
                    onChange={(e) => onChange(f.key, e.target.value === "" ? null : Number(e.target.value))}
                  />
                </label>
              );
            }
            return (
              <label key={f.key} className="text-sm">
                {f.label}
                <input
                  type="text"
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={values[f.key] ?? ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              </label>
            );
          })}
        </div>
      );
    }

    if (schema.type === "list" && Array.isArray(schema.columns)) {
      const col = schema.columns[0] ?? { key: "text", label: "Eintrag", type: "text" };
      const items: any[] = Array.isArray(values._rows) ? values._rows : [];
      return (
        <div className="space-y-2">
          {items.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                value={row[col.key] ?? ""}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], [col.key]: e.target.value };
                  onChange("_rows", next);
                }}
              />
              <button
                type="button"
                className="text-xs border rounded px-2 py-1"
                onClick={() => onChange("_rows", items.filter((_, j) => j !== idx))}
              >
                Entfernen
              </button>
            </div>
          ))}
          <button type="button" className="text-xs border rounded px-2 py-1" onClick={() => onChange("_rows", [...items, { [col.key]: "" }])}>
            + Zeile
          </button>
        </div>
      );
    }

    return <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">{JSON.stringify(schema, null, 2)}</pre>;
  }, [schema, values]);

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{definitionLabel || "Formular"}</h1>
        <Link href="/metzgerei" className="text-sm underline">Zurück</Link>
      </div>

      {loading && <p className="text-sm">Lade…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && !err && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
          <label className="text-sm">
            Datum
            <input type="date" className="mt-1 w-56 rounded border px-3 py-2 text-sm" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </label>

          <div className="text-xs opacity-70">Zeitraum: <span className="font-mono">{period || "none"}</span></div>

          <div className="pt-2">{FormBody}</div>

          <div className="flex items-center gap-3">
            <button type="submit" className="rounded bg-black text-white text-sm px-4 py-2 disabled:opacity-50" disabled={saving}>
              {saving ? "Speichere…" : "Speichern & fertig"}
            </button>
            <button type="button" className="rounded border text-sm px-3 py-2" onClick={() => router.push("/metzgerei")}>
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
