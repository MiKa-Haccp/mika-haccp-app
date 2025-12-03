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
  periodRef: string | null;
  status: string;
  updatedAt: string;
  definition: { label: string; marketId: string | null };
};

// ⬇️ HIER das neu einfügen:
function getMetzgereiFormRoute(def: Def): string | null {
  // Hier mappen wir bestimmte Definitionen auf „Spezial-Seiten“

    // Wareneingang Fleisch
  if (def.id === "FORM_METZ_WE_FLEISCH" || def.sectionKey === "we-fleisch") {
    return "/metzgerei/we-fleisch";
  }

  // Wareneingang Obst/Gemüse
  if (def.id === "FORM_METZ_WE_OBST" || def.sectionKey === "we-obst") {
    return "/metzgerei/we-obst";
  }

  // Hier später: heiße Theke, Reinigungsplan Woche, Schulungsprotokoll …
  // z.B.:
  // if (def.id === "FORM_METZ_HEISSE_THEKE") return "/metzgerei/heisse-theke";

  return null; // Default: keine Spezialseite
}

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

  async function createAndOpen(def: Def) {
    if (!selected?.id) {
      alert("Bitte zuerst Markt wählen");
      return;
    }

    // 1) Prüfen, ob wir eine „Spezial-Seite“ für dieses Formular haben
    const directRoute = getMetzgereiFormRoute(def);
    if (directRoute) {
      // Marktinfo steckt im Context, also können wir direkt dorthin springen
      router.push(directRoute);
      return;
    }

    // 2) Ansonsten: generischer Weg über FormInstance + FormEditor
    try {
      const res = await fetch("/api/forms/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ definitionId: def.id, marketId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        alert(json?.error || "Erzeugen fehlgeschlagen");
        return;
      }
      router.push(`/metzgerei/instance/${json.id}`);
    } catch {
      alert("Neuer Eintrag konnte nicht erzeugt werden.");
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
                className="rounded px-3 py-1 text-xs bg-black text-white disabled:opacity-50"
                disabled={!selected?.id}
                onClick={() => selected?.id && createAndOpen(d)}
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
    </main>
  );
}
