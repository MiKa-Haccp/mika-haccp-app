"use client";

import Link from "next/link";

export default function DokuOverviewPage() {
  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold mb-1">Dokumentation</h1>
        <p className="text-sm opacity-70">
          Wähle einen Bereich, für den du die Dokumentation ansehen möchtest.
          Die Daten kommen aus den jeweiligen Erfassungsseiten (Allgemein,
          Markt, Metzgerei).
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dokumentation/allgemein"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <h2 className="text-lg font-semibold">Allgemein</h2>
          <p className="text-sm opacity-70 mt-1">
            Jahres- oder Quartals-Dokumentationen aus dem allgemeinen Bereich.
          </p>
        </Link>

        <Link
          href="/dokumentation/markt"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <h2 className="text-lg font-semibold">Markt</h2>
          <p className="text-sm opacity-70 mt-1">
            Dokumentationen für Markt-Formulare (z.&nbsp;B. Lager, Verkaufsraum).
          </p>
        </Link>

        <Link
          href="/dokumentation/metzgerei"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <h2 className="text-lg font-semibold">Metzgerei</h2>
          <p className="text-sm opacity-70 mt-1">
            Bereits vorhandene Dokumentationen: tägliche Reinigung, wöchentliche
            Reinigung, Wareneingänge usw.
          </p>
        </Link>
      </section>
    </main>
  );
}



