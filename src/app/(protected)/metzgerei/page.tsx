"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tile = {
  slug: string;    // z.B. "taegl-reinigung"
  label: string;   // z.B. "Tägliche Reinigung"
  period: string | null;
  ok: boolean;     // aktueller Zeitraum erledigt = true/false
};

type Status = "loading" | "ok" | "empty" | "error";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${
        ok ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}

export default function MetzgereiPage() {
  const [marketId, setMarketId] = useState<string | null>(null);
  const [items, setItems] = useState<Tile[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // aktiven Markt aus localStorage holen
  useEffect(() => {
    try {
      const mk = localStorage.getItem("activeMarketId");
      if (mk) setMarketId(mk);
      else setStatus("empty");
    } catch {
      setStatus("error");
      setErrorMsg("Konnte Markt nicht ermitteln.");
    }
  }, []);

  // Status der Metzgerei-Formulare für diesen Markt laden
  useEffect(() => {
    if (!marketId) return;

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMsg(null);

      try {
        const res = await fetch(
          `/api/metzgerei/status?marketId=${encodeURIComponent(marketId)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = await res.json();
        const list: Tile[] = json?.items ?? [];

        if (!cancelled) {
          setItems(list);
          setStatus(list.length ? "ok" : "empty");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("MetzgereiPage load error", err);
          setStatus("error");
          setErrorMsg("Konnte Status für Metzgerei nicht laden.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [marketId]);

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">Metzgerei</h1>
        <p className="text-sm opacity-70">
          Übersicht der Aufgaben in der Metzgerei (täglich, wöchentlich,
          monatlich, vierteljährlich, halbjährlich, jährlich, Wareneingang,
          Salate, etc.). Klicke eine Kachel an, um das Formular für heute bzw.
          den Zeitraum auszufüllen.
        </p>
      </header>

      {status === "loading" && <p className="text-sm">Lade…</p>}

      {status === "error" && (
        <p className="text-sm text-red-600">
          {errorMsg ?? "Fehler beim Laden."}
        </p>
      )}

      {status === "empty" && (
        <p className="text-sm opacity-70">
          Für diesen Markt sind noch keine Metzgerei-Formulare hinterlegt.
        </p>
      )}

      {status === "ok" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/metzgerei/${item.slug}`}
              className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-gray-50"
            >
              <Dot ok={item.ok} />
              <div>
                <div className="font-semibold">{item.label}</div>
                {item.period && (
                  <div className="text-[11px] opacity-70 mt-0.5">
                    Zeitraum: {item.period}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
