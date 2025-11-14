"use client";

import Link from "next/link";

export default function DokuMetzgereiPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dokumentation · Metzgerei</h1>
      <p className="text-sm opacity-70">
        Hier siehst du die Monatsübersichten für die Metzgerei-Formulare.
      </p>

      <ul className="space-y-2">
        <li>
          <Link
            href="/dokumentation/metzgerei/taegl-reinigung"
            className="block rounded-xl border p-4 hover:bg-gray-50"
          >
            Tägliche Reinigung
          </Link>
        </li>

        <li>
          <Link
            href="/dokumentation/metzgerei/woech-reinigung"
            className="block rounded-xl border p-4 hover:bg-gray-50"
          >
            Wöchentliche Reinigung
          </Link>
        </li>
      </ul>
    </main>
  );
}
