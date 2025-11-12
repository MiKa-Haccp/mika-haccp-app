'use client';

import Link from "next/link";
import { useDokuSections } from "@/hooks/useDokuSections";

function Dot({ status }: { status: "ok" | "open" }) {
  const cls = status === "ok" ? "bg-green-500" : "bg-red-500";
  return <span className={`inline-block h-3 w-3 rounded-full ${cls}`} />;
}

export default function Page() {
  const { sections, isLoading, error } = useDokuSections(); // ← lädt /api/doku/sections

  if (isLoading) return <main className="p-6">Lade…</main>;
  if (error) return <main className="p-6 text-red-600">Fehler beim Laden.</main>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dokumentation</h1>
      <ul className="space-y-2">
        {sections?.map((s: any) => (
          <li key={s.slug ?? s.id} className="flex items-center gap-3">
            <Dot status={(s.status as "ok" | "open") ?? "open"} />
            <Link
              href={`/dokumentation/${s.slug ?? s.id}`}
              className="flex-1 rounded-xl border p-4 hover:bg-gray-50"
            >
              {s.label}
            </Link>
          </li>
        ))}
        {(!sections || sections.length === 0) && (
          <li className="opacity-70">Noch keine Sektionen angelegt.</li>
        )}
      </ul>
    </main>
  );
}
