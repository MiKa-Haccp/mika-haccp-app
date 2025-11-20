"use client";

import Link from "next/link";

export default function OverviewPage() {
  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold mb-1">Übersicht</h1>
        <p className="text-sm opacity-70">
          Wähle einen Bereich aus: Allgemein, Markt, Metzgerei oder gehe direkt
          in die Dokumentation bzw. den Admin-Bereich.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/allgemein"
          className="rounded-2xl border p-4 hover:bg-gray-50 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold">Allgemein</h2>
            <p className="text-sm opacity-70 mt-1">
              Übergreifende Formulare und Dokumente, z.&nbsp;B. Betriebsbegehungen,
              Unterweisungen, Schulungen.
            </p>
          </div>
        </Link>

        <Link
          href="/markt"
          className="rounded-2xl border p-4 hover:bg-gray-50 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold">Markt</h2>
            <p className="text-sm opacity-70 mt-1">
              Checklisten und Nachweise für den kompletten Marktbereich.
            </p>
          </div>
        </Link>

        <Link
          href="/metzgerei"
          className="rounded-2xl border p-4 hover:bg-gray-50 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold">Metzgerei</h2>
            <p className="text-sm opacity-70 mt-1">
              Tägliche/Wöchentliche Reinigung, Wareneingang, Temperaturen usw.
            </p>
          </div>
        </Link>

        <Link
          href="/dokumentation"
          className="rounded-2xl border p-4 hover:bg-gray-50 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold">Dokumentation</h2>
            <p className="text-sm opacity-70 mt-1">
              Monats- und Jahresübersichten für alle Formulare – das, was du dem
              Gesundheitsamt zeigst.
            </p>
          </div>
        </Link>

        <Link
          href="/admin"
          className="rounded-2xl border p-4 hover:bg-gray-50 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-semibold">Admin</h2>
            <p className="text-sm opacity-70 mt-1">
              Personal & PINs, Doku-Sektionen, Formulare und später
              Markt-Einladungen. Nur für Admin/Superadmin.
            </p>
          </div>
        </Link>
      </section>
    </main>
  );
}
