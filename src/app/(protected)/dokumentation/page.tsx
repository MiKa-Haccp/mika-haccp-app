import Link from "next/link";

export default function DokuIndexPage() {
  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4">
        <span className="mika-brand">Dokumentation</span>
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dokumentation/allgemein"
          className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mika-brand">Allgemein</h3>
          <p className="opacity-70 text-sm">Globale Nachweise & Hinweise</p>
        </Link>

        <Link
          href="/dokumentation/markt"
          className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mika-brand">Markt</h3>
          <p className="opacity-70 text-sm">Markt­bezogene Nachweise</p>
        </Link>

        <Link
          href="/dokumentation/metzgerei"
          className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mika-brand">Metzgerei</h3>
          <p className="opacity-70 text-sm">Formulare & Doku in der Metzgerei</p>
        </Link>
      </div>
    </main>
  );
}
