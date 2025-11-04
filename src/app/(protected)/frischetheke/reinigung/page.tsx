"use client";
import { useState } from "react";

export default function Reinigung() {
  const [done, setDone] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Reinigung ${done ? "abgehakt" : "offen"}`);
    // TODO: Supabase insert in 'reinigung'
  };

  return (
    <main className="py-6">
      <form onSubmit={save} className="mika-frame grid gap-4 max-w-xl">
        <h1 className="text-xl font-bold mika-brand">Reinigungsplan</h1>
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={done} onChange={(e)=>setDone(e.target.checked)} />
          Heute erledigt
        </label>
        <button className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold">Speichern</button>
      </form>
    </main>
  );
}
