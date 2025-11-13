export default function AdminHub() {
  return (
    <main className="p-6 grid gap-4 sm:grid-cols-2">
      <a href="/dokumentation/admin" className="rounded-2xl border p-6 hover:shadow">
        <h2 className="font-semibold text-lg">Dokumentation · Sektionen</h2>
        <p className="opacity-70 text-sm">Globale & Markt-Sektionen verwalten</p>
      </a>
      <a href="/personal/admin" className="rounded-2xl border p-6 hover:shadow">
        <h2 className="font-semibold text-lg">Personal · PINs</h2>
        <p className="opacity-70 text-sm">Mitarbeiter anlegen, PINs setzen/zurücksetzen</p>
      </a>
    </main>
  );
}
