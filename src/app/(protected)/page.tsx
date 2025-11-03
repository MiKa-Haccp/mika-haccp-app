import Link from "next/link";

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-gray-400 group-hover:translate-x-0.5 transition">→</span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </Link>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">MiKa HACCP</h1>
      <p className="text-gray-600 mb-10">Wähle einen Bereich aus:</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile href="/frischetheke" title="Frischetheke To Do" desc="Temperaturen, Reinigung, Prüfungen" />
        <Tile href="/markt" title="Markt To Do" desc="Rundgänge, Wareneingang, Korrekturmaßnahmen" />
        <Tile href="/dokumentation" title="Dokumentation" desc="Schulungen, Nachweise, Formulare" />
      </div>
    </main>
  );
}
