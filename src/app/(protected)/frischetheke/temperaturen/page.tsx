"use client";

import { useState } from "react";

export default function Temperaturen() {
  const [eintrag, setEintrag] = useState({ ort: "", ist: "", soll: "0–4 °C" });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Gespeichert: ${eintrag.ort} – ${eintrag.ist} (Soll: ${eintrag.soll})`);
    // TODO: Supabase insert in Tabelle 'temperaturen'
  };

  return (
    <main className="py-6">
      <div className="mika-frame grid gap-4 max-w-xl">
        <h1 className="text-xl font-bold mika-brand">Temperatur erfassen</h1>
        <label className="mika-label">Ort / Gerät</label>
        <input className="mika-input" value={eintrag.ort} onChange={e=>setEintrag(v=>({...v, ort:e.target.value}))} placeholder="z. B. Kühltheke 1" />
        <label className="mika-label">Ist-Temperatur</label>
        <input className="mika-input" value={eintrag.ist} onChange={e=>setEintrag(v=>({...v, ist:e.target.value}))} placeholder="z. B. 3.2 °C" />
        <label className="mika-label">Soll-Bereich</label>
        <input className="mika-input" value={eintrag.soll} onChange={e=>setEintrag(v=>({...v, soll:e.target.value}))} />
        <button className="mika-btn rounded-xl px-4 py-3 text-sm font-semibold">Speichern</button>
      </div>
    </main>
  );
}
