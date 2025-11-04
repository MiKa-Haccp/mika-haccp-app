import Link from "next/link";

export default function Doku() {
  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4"><span className="mika-brand">Dokumentation</span></h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dokumentation/schulungen" className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mika-brand">Schulungen</h3>
          <p className="opacity-70 text-sm">Teilnahmen, Inhalte, Nachweise</p>
        </Link>
        <Link href="/dokumentation/formulare" className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mika-brand">Formulare</h3>
          <p className="opacity-70 text-sm">Vorlagen, Checklisten</p>
        </Link>
      </div>
    </main>
  );
}
