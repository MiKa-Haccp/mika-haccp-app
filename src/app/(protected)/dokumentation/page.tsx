"use client";
import Link from "next/link";
import { useDokuSections } from "@/hooks/useDokuSections";

export default function Doku() {
  const { sections, loading } = useDokuSections();

  return (
    <main className="py-6">
      <h1 className="text-2xl font-extrabold mb-4"><span className="mika-brand">Dokumentation</span></h1>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="rounded-2xl p-5 mika-card h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map(s => (
            <Link key={s.id} href={`/dokumentation/${s.slug}`} className="rounded-2xl p-5 mika-card shadow block hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mika-brand">{s.title}</h3>
              {s.subtitle && <p className="opacity-70 text-sm">{s.subtitle}</p>}
            </Link>
          ))}
          {!sections.length && (
            <div className="rounded-2xl p-5 mika-card border">
              <p className="text-sm opacity-70">Noch keine Bereiche angelegt. Bitte in der Admin-Ansicht hinzufügen.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

