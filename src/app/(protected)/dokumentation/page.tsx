"use client";

import Link from "next/link";

export default function DokuMetzgereiPage() {
  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">
          Dokumentation · Metzgerei
        </h1>
        <p className="text-sm opacity-70">
          Read-only-Ansicht der Reinigungen in der Metzgerei.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dokumentation/metzgerei/taegl-reinigung"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Tägliche Reinigung</div>
          <div className="text-xs opacity-70">
            Monatsübersicht der täglichen Reinigungen.
          </div>
        </Link>

        <Link
          href="/dokumentation/metzgerei/woech-reinigung"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Wöchentliche Reinigung</div>
          <div className="text-xs opacity-70">
            Monats-/Wochenübersicht der wöchentlichen Reinigungen.
          </div>
        </Link>

        <Link
          href="/dokumentation/metzgerei/monat-reinigung"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Monatliche Reinigung</div>
          <div className="text-xs opacity-70">
            Monatsübersicht der monatlichen Reinigungen.
          </div>
        </Link>

        <Link
          href="/dokumentation/metzgerei/viertel-reinigung"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Vierteljährliche Reinigung</div>
          <div className="text-xs opacity-70">
            Quartalsübersicht.
          </div>
        </Link>

        <Link
          href="/dokumentation/metzgerei/halbjahr-reinigung"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Halbjährliche Reinigung</div>
          <div className="text-xs opacity-70">
            Übersicht der Halbjahres-Reinigungen.
          </div>
        </Link>

        <Link
          href="/dokumentation/metzgerei/jahr-reinigung"
          className="rounded-2xl border p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Jährliche Reinigung</div>
          <div className="text-xs opacity-70">
            Jahresübersicht der Hauptreinigung.
          </div>
        </Link>

        <Link
          href="/dokumentation/metzgerei/we-fleisch"
          className="block rounded-xl border p-3 hover:bg-gray-50"
       >
          Wareneingang Fleisch
        </Link>

        <Link
          href="/dokumentation/metzgerei/we-obst"
          className="block rounded-xl border p-4 hover:bg-gray-50"
        >
        Wareneingang Obst 
        </Link>

        <Link
          href="/dokumentation/metzgerei/salat-oeffnung"
          className="block rounded-xl border p-3 hover:bg-gray-50"
        >
          Salatöffnung / geöffnete Salate
        </Link>

      </section>
    </main>
  );
}


