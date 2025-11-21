"use client";

import { useMarket } from "@/components/MarketProvider";

export default function Page() {
  const { selected } = useMarket();
  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold mb-4">Market Debug</h1>
      <pre className="rounded-xl border p-4 bg-gray-50">
        {JSON.stringify(selected, null, 2)}
      </pre>
      <p className="mt-3 opacity-70">Wähle oben im Navbar-Switcher einen Markt oder „Alle Märkte (global)“.</p>
    </main>
  );
}
