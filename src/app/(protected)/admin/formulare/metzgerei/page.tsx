"use client";

import { useEffect, useMemo, useState } from "react";

type Def = {
  id: string;
  label: string;
  sectionKey: string;
  period: string;
  active: boolean;
  marketId: string | null;
  createdAt: string;
};

export default function Page() {
  const [list, setList] = useState<Def[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Formularzustand (entspricht deinen Feldern)
  const [id, setId] = useState("FORM_METZ_WE_HUHN");
  const [label, setLabel] = useState("Metzgerei – WE Hühnerbein");
  const [sectionKey, setSectionKey] = useState("we-huhn");
  const [period, setPeriod] = useState("none"); // – kein Zeitraum –
  const [type, setType] = useState("Einfaches Häkchenformular");
  const [active, setActive] = useState(true);
  const [scope, setScope] = useState<"global" | "market">("global");
  const [onlyForMarketId, setOnlyForMarketId] = useState<string>(""); // optional

  const scopeInfo = useMemo(
    () => (scope === "global" ? "global (in allen Märkten sichtbar)" : "nur in gewähltem Markt sichtbar"),
    [scope]
  );

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/formdefinitions?category=metzgerei");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setList(data);
    } catch (e: any) {
      setErr("Konnte Formulare nicht laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const body = {
      id,
      label,
      sectionKey,
      period,
      type,
      active,
      categoryKey: "metzgerei",
      marketId: scope === "global" ? null : (onlyForMarketId || null),
    };

    try {
      const res = await fetch("/api/admin/formdefinitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j.error || "Fehler beim Anlegen");
      }
      await load();
      alert("Formular angelegt.");
    } catch (e: any) {
      setErr(e.message || "Fehler beim Anlegen.");
    }
  }

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold mb-4">Formulare · Metzgerei</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Neues Formular anlegen</h2>

        <form onSubmit={onCreate} className="grid gap-3 max-w-xl">
          <label className="grid gap-1">
            <span className="text-sm opacity-70">ID (technisch, eindeutig)</span>
            <input className="mika-input" value={id} onChange={(e) => setId(e.target.value)} required />
          </label>

          <label className="grid gap-1">
            <span className="text-sm opacity-70">Name / Bezeichnung</span>
            <input className="mika-input" value={label} onChange={(e) => setLabel(e.target.value)} required />
          </label>

          <label className="grid gap-1">
            <span className="text-sm opacity-70">Slug / sectionKey (für URL)</span>
            <input className="mika-input" value={sectionKey} onChange={(e) => setSectionKey(e.target.value)} required />
            <span className="text-xs opacity-60">Wird z.B. als /dokumentation/metzgerei/{sectionKey || "we-huhn"} verwendet.</span>
          </label>

          <label className="grid gap-1">
            <span className="text-sm opacity-70">Zeitraum / Häufigkeit</span>
            <select className="mika-input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="none">– kein Zeitraum –</option>
              <option value="daily">täglich</option>
              <option value="weekly">wöchentlich</option>
              <option value="monthly">monatlich</option>
              <option value="yearly">jährlich</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm opacity-70">Formular-Typ</span>
            <select className="mika-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option>Einfaches Häkchenformular</option>
              {/* später: Reinigung, Wareneingang, Liste ... */}
            </select>
            <span className="text-xs opacity-60">Steuert später, welche Felder das Formular hat.</span>
          </label>

          <label className="inline-flex items-center gap-2 mt-1">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Aktiv (in der Dokumentation anzeigen)</span>
          </label>

          <div className="grid gap-2 mt-2">
            <span className="text-sm opacity-70">Sichtbarkeit</span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "global"}
                  onChange={() => setScope("global")}
                />
                <span>Global</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "market"}
                  onChange={() => setScope("market")}
                />
                <span>Nur in Markt</span>
              </label>
              {scope === "market" && (
                <input
                  className="mika-input w-56"
                  placeholder="marketId (optional)"
                  value={onlyForMarketId}
                  onChange={(e) => setOnlyForMarketId(e.target.value)}
                />
              )}
            </div>
            <span className="text-xs opacity-60">{scopeInfo}</span>
          </div>

          <div className="mt-3">
            <button className="rounded-xl px-4 py-2 border hover:shadow" type="submit">
              Anlegen
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Vorhandene Formulare</h2>
        {loading ? (
          <div>Laden…</div>
        ) : err ? (
          <div className="text-red-600">{err}</div>
        ) : list.length === 0 ? (
          <div className="opacity-70">Keine Formulare gefunden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Label</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Aktiv</th>
                  <th className="py-2 pr-3">Scope</th>
                  <th className="py-2 pr-3">Angelegt</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="py-2 pr-3 font-mono text-xs">{d.id}</td>
                    <td className="py-2 pr-3">{d.label}</td>
                    <td className="py-2 pr-3">{d.sectionKey}</td>
                    <td className="py-2 pr-3">{d.active ? "ja" : "nein"}</td>
                    <td className="py-2 pr-3">{d.marketId ? `nur Markt ${d.marketId}` : "global"}</td>
                    <td className="py-2 pr-3">{new Date(d.createdAt).toLocaleString()}</td>
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
