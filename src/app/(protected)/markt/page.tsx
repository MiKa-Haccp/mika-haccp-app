import Link from "next/link";

export default function Markt() {
  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4"><span className="mika-brand">Markt ToDo's</span> </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/markt/rundgang" className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mika-brand">Rundgang</h3>
          <p className="opacity-70 text-sm">Mängel, Fotos, Maßnahmen</p>
        </Link>
        <Link href="/markt/wareneingang" className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mika-brand">Wareneingang</h3>
          <p className="opacity-70 text-sm">Temperatur, Unversehrtheit, Papiere</p>
        </Link>
      </div>
    </main>
  );
}
