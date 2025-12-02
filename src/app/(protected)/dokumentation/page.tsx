// src/app/(protected)/dokumentation/page.tsx
import Link from "next/link";

export default function DokumentationPage() {
  return (
    <main className="py-6">
      <h1 className="mb-4 text-2xl font-extrabold">
        <span className="mika-brand">Dokumentation</span>
      </h1>

      <p className="mb-6 text-sm opacity-70">
        Wähle einen Bereich aus, um die passenden Nachweise und Formulare zu
        sehen.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Link
          href="/dokumentation/allgemein"
          className="mika-card block rounded-2xl p-5 shadow transition hover:shadow-lg"
        >
          <h2 className="text-lg font-semibold mika-brand">Allgemein</h2>
          <p className="text-sm opacity-70">
            Übergreifende Dokumente und Nachweise für alle Bereiche.
          </p>
        </Link>

        <Link
          href="/dokumentation/markt"
          className="mika-card block rounded-2xl p-5 shadow transition hover:shadow-lg"
        >
          <h2 className="text-lg font-semibold mika-brand">Markt</h2>
          <p className="text-sm opacity-70">
            Marktbezogene Checklisten und Nachweise.
          </p>
        </Link>

        <Link
          href="/dokumentation/metzgerei"
          className="mika-card block rounded-2xl p-5 shadow transition hover:shadow-lg"
        >
          <h2 className="text-lg font-semibold mika-brand">Metzgerei</h2>
          <p className="text-sm opacity-70">
            Formblätter und Archiv für die Metzgerei.
          </p>
        </Link>

        <Link
          href="/dokumentation/archiv"
          className="mika-card block rounded-2xl p-5 shadow transition hover:shadow-lg"
        >
          <h2 className="text-lg font-semibold mika-brand">Archiv</h2>
          <p className="text-sm opacity-70">
            Zurückliegende Dokumentation nach Jahren und Bereichen.
          </p>
        </Link>
      </div>
    </main>
  );
}

