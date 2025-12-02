// src/app/(protected)/dokumentation/archiv/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type YearResponse = {
  years: number[];
};

function isArchiveYear(year: number, now: Date): boolean {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear - 1) return true;
  if (year === currentYear - 1 && currentMonth >= 2) return true;
  return false;
}

export default function ArchivePage() {
  const [metzgereiYears, setMetzgereiYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Metzgerei-Jahre holen
        const yearsRes = await fetch("/api/doku/metzgerei/years", {
          cache: "no-store",
        });
        if (!yearsRes.ok) {
          throw new Error("Metzgerei-Jahre konnten nicht geladen werden");
        }
        const data: YearResponse = await yearsRes.json();
        if (cancelled) return;

        const allYears = data.years || [];
        const archive = allYears.filter((y) => isArchiveYear(y, now));
        setMetzgereiYears(archive);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(err.message ?? "Unbekannter Fehler");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4">
        <span className="mika-brand">Archiv</span>
      </h1>

      <p className="text-sm opacity-70 mb-4">
        Hier findest du abgeschlossene Jahrgänge, die nicht mehr im
        Haupt-Dokumentationsbereich angezeigt werden.
      </p>

      <p className="text-xs mb-3">
        <Link href="/dokumentation" className="underline">
          &larr; Zur Dokumentationsübersicht
        </Link>
      </p>

      {loading && <p>Lade Archiv…</p>}

      {!loading && error && (
        <p className="text-sm text-red-600 mb-4">
          Fehler: {error}
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Metzgerei</h2>
            {metzgereiYears.length === 0 ? (
              <p className="text-sm opacity-70">
                Es sind noch keine Metzgerei-Jahrgänge im Archiv. Sobald das
                zweite Jahr abgeschlossen ist und der Januar vorbei ist, werden
                hier ältere Jahre angezeigt.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {metzgereiYears.map((year) => (
                  <Link
                    key={year}
                    href={`/dokumentation/metzgerei/jahre/${year}`}
                    className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
                  >
                    <h3 className="text-base font-semibold">Jahr {year}</h3>
                    <p className="text-sm opacity-70">
                      Archivierte Metzgerei-Formblätter.
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Platzhalter für andere Kategorien */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Weitere Bereiche</h2>
            <p className="text-sm opacity-70">
              Archivansichten für Allgemein, Markt oder Bäckerei können wir
              analog zur Metzgerei ergänzen, sobald dort Jahresdaten
              vorliegen.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
