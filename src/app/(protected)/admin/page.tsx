"use client";

import Link from "next/link";

export default function AdminHubPage() {
  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin-Bereich</h1>
          <p className="text-sm opacity-70">
            Zentrale Verwaltung: Personal/PINs, Doku-Sektionen, Formulare und Einladungen.
          </p>
        </div>
        <Link href="/" className="text-sm underline">
          ← Zur Übersicht
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Personal & PINs */}
        <Link
          href="/personal/admin"
          className="rounded-2xl border p-4 hover:bg-gray-50 block"
        >
          <h2 className="text-lg font-semibold">Personal &amp; PINs</h2>
          <p className="text-sm opacity-70 mt-1">
            Mitarbeiter anlegen, PINs setzen/zurücksetzen, Rollen (Admin/Superadmin) verwalten.
          </p>
        </Link>

        {/* Doku-Sektionen */}
        <Link
          href="/dokumentation/admin" className="..."
          className="rounded-2xl border p-4 hover:bg-gray-50 block"
        >
          <h2 className="text-lg font-semibold">Doku-Sektionen</h2>
          <p className="text-sm opacity-70 mt-1">
            Globale und marktbezogene Dokumentations-Sektionen (Allgemein, Markt, Metzgerei, …) pflegen.
          </p>
        </Link>

        {/* Formulare Metzgerei */}
        <Link
          href="/dokumentation/admin/forms-metzgerei"
          className="rounded-2xl border p-4 hover:bg-gray-50 block"
        >
          <h2 className="text-lg font-semibold">Formulare Metzgerei</h2>
          <p className="text-sm opacity-70 mt-1">
            Technische Form-Definitionen für Metzgerei (täglich, wöchentlich, Wareneingang, …).
          </p>
        </Link>

        {/* Einladungen (Supabase-Invite) */}
        <Link
          href="/admin/invite"
          className="rounded-2xl border p-4 hover:bg-gray-50 block"
        >
          <h2 className="text-lg font-semibold">Einladungen</h2>
          <p className="text-sm opacity-70 mt-1">
            Neue Benutzer per E-Mail einladen (Supabase-Einladungen). Nur Admins aus ADMIN_EMAILS.
          </p>
        </Link>
      </section>
    </main>
  );
}
