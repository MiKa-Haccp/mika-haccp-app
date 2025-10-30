// src/app/frischetheke/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // oder "@/lib/..." wenn Alias gesetzt

type Temp = {
  id: string;
  date: string;
  time: string;
  device: string;
  location: string;
  temperature: number | null;
  ccp: boolean;
  action_note: string | null;
  employee: string;
};

export default function Page() {
  const [items, setItems] = useState<Temp[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    device: "",
    location: "",
    temperature: "",
    ccp: false,
    action_note: "",
    employee: "",
  });
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Bitte erst /login benutzen."); return; }

    const { data, error } = await supabase
      .from("temp_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    setItems((data as any) ?? []);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setErr("Nicht eingeloggt.");

    const payload = {
      ...form,
      temperature: form.temperature === "" ? null : Number(form.temperature),
      user_id: user.id, // wichtig für RLS
    };

    const { error } = await supabase.from("temp_logs").insert(payload);
    if (error) return setErr(error.message);

    setForm({ ...form, device: "", location: "", temperature: "", action_note: "", employee: "" });
    load();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Frischetheke – To Do</h1>
      <p className="mt-2 text-gray-600">Temperatur-Log (Supabase-Test).</p>

      <form onSubmit={save} className="mt-6 grid gap-2 sm:grid-cols-2">
        <input type="date" value={form.date} onChange={e=>setForm(p=>({ ...p, date: e.target.value }))} className="border p-2" />
        <input type="time" value={form.time} onChange={e=>setForm(p=>({ ...p, time: e.target.value }))} className="border p-2" />
        <input placeholder="Gerät/Produkt" value={form.device} onChange={e=>setForm(p=>({ ...p, device: e.target.value }))} className="border p-2" />
        <input placeholder="Ort/Bereich" value={form.location} onChange={e=>setForm(p=>({ ...p, location: e.target.value }))} className="border p-2" />
        <input type="number" step="0.1" placeholder="Temp (°C)" value={form.temperature}
               onChange={e=>setForm(p=>({ ...p, temperature: e.target.value }))} className="border p-2" />
        <label className="border p-2 flex items-center gap-2">
          <input type="checkbox" checked={form.ccp} onChange={e=>setForm(p=>({ ...p, ccp: e.target.checked }))} /> CCP?
        </label>
        <input placeholder="Aktion (bei Abweichung)" value={form.action_note || ""} onChange={e=>setForm(p=>({ ...p, action_note: e.target.value }))} className="border p-2 sm:col-span-2" />
        <input placeholder="Mitarbeiter/in" value={form.employee} onChange={e=>setForm(p=>({ ...p, employee: e.target.value }))} className="border p-2 sm:col-span-2" />
        <button className="border p-2 sm:col-span-2">Speichern</button>
      </form>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <div className="mt-6 border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Datum</th>
              <th className="text-left p-2">Zeit</th>
              <th className="text-left p-2">Gerät</th>
              <th className="text-left p-2">Ort</th>
              <th className="text-left p-2">Temp</th>
              <th className="text-left p-2">CCP</th>
              <th className="text-left p-2">MA</th>
            </tr>
          </thead>
          <tbody>
            {items.map(e => (
              <tr key={e.id} className="border-t">
                <td className="p-2">{e.date}</td>
                <td className="p-2">{e.time}</td>
                <td className="p-2">{e.device}</td>
                <td className="p-2">{e.location}</td>
                <td className="p-2">{e.temperature ?? ""}</td>
                <td className="p-2">{e.ccp ? "Ja" : "Nein"}</td>
                <td className="p-2">{e.employee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

