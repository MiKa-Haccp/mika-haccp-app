import Link from "next/link";

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-2xl p-5 mika-card shadow hover:shadow-lg transition block">
      <h3 className="text-lg font-semibold mika-brand">{title}</h3>
      <p className="mt-1 text-sm opacity-70">{desc}</p>
    </Link>
  );
}

export default function Frischetheke() {
  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4"><span className="mika-brand">Frischetheke ToDo's</span> </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile href="/frischetheke/temperaturen" title="Temperaturen" desc="Kühlstellen, Warmhalte, Protokoll" />
        <Tile href="/frischetheke/reinigung" title="Reinigung" desc="Reinigungsplan, Freigabe, Nachweis" />
        <Tile href="/frischetheke/allergen" title="Allergen-Check" desc="Kennzeichnung, Aktualisierung" />
      </div>
    </main>
  );
}


