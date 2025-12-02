// src/app/(protected)/dokumentation/metzgerei/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMarket } from "@/components/MarketProvider";

type FormSummary = {
  id: string;
  label: string;
  period: string | null;
  marketId: string | null;
  sectionKey: string;
};

type FormsResponse = {
  forms: FormSummary[];
};

export default function MetzgereiDokuPage() {
  const { selected } = useMarket();

  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"label" | "period">("label");

  useEffect(() => {
    const marketId = selected?.id;

    // Kein Markt gewählt → Meldung + nichts laden
    if (!marketId) {
      setForms([]);
      setError("Kein Markt ausgewählt. Bitte oben im Kopfbereich einen Markt wählen.");
      setLoading(false);
      return;
    }

    async function load(currentMarketId: string) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/doku/metzgerei/forms?marketId=${encodeURIComponent(marketId ?? "")}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("Formulare konnten nicht geladen werden");
        }

        const json: FormsResponse = await res.json();
        setForms(json.forms ?? []);
      } catch (err: any) {
        console.error(err);
       setError(err.message ?? "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load(marketId);
  }, [selected?.id]);

  const sortedForms = useMemo(() => {
    const list = [...forms];
    if (sortBy === "label") {
      list.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      list.sort((a, b) => {
        const pa = a.period ?? "";
        const pb = b.period ?? "";
        if (pa === pb) return a.label.localeCompare(b.label);
        return pa.localeCompare(pb);
      });
    }
    return list;
  }, [forms, sortBy]);

  // ⬇️ Ab hier ist React glücklich, weil ALLE Hooks schon oben aufgerufen wurden

  // Falls selected wirklich null ist (z.B. MarketProvider noch am Laden)
  if (!selected) {
    return (
      <main className="py-6">
        <h1 className="text-2xl font-extrabold mb-2">
          <span className="mika-brand">Dokumentation Metzgerei</span>
        </h1>
        <p className="text-sm text-red-600">
          Kein Markt ausgewählt. Bitte oben im Kopfbereich einen Markt wählen.
        </p>
      </main>
    );
  }

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-2">
        <span className="mika-brand">Dokumentation Metzgerei</span>
      </h1>

      <p className="text-sm opacity-70 mb-4">
        Markt: <span className="font-semibold">{selected.name}</span>
      </p>

      {/* Sortierung */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs opacity-70">Sortierung:</span>
        <select
          className="border rounded px-2 py-1 text-xs"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "label" | "period")}
        >
          <option value="label">Name (A–Z)</option>
          <option value="period">Zeitraum</option>
        </select>
      </div>

      {loading && <p>Lade Formulare…</p>}

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Fehler: {error}
        </p>
      )}

      {!loading && !error && sortedForms.length === 0 && (
        <p className="text-sm opacity-70">
          Es sind noch keine Metzgerei-Formulare für diesen Markt vorhanden.
        </p>
      )}

      {!loading && !error && sortedForms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sortedForms.map((f) => {
            const scopeLabel = f.marketId ? "Markt-spezifisch" : "Global";

            return (
              <Link
                key={f.id}
                href={`/dokumentation/metzgerei/${f.sectionKey}`}
                className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
              >
                <div className="text-xs opacity-60 mb-1">
                  {scopeLabel} · Zeitraum: {f.period ?? "–"}
                </div>
                <div className="font-semibold mb-2">{f.label}</div>
                <p className="text-xs opacity-70">
                  Monatsübersicht &amp; Einträge für dieses Formular ansehen.
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
