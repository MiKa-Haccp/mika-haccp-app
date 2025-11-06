"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SectionDetail() {
  const params = useParams();
  const sectionId = params.id as string;

  const [section, setSection] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: sec } = await supabase.from("sections").select("*").eq("id", sectionId).single();
      setSection(sec);

      const { data: ent } = await supabase
        .from("entries")
        .select("*")
        .eq("section_id", sectionId)
        .order("created_at", { ascending: false });
      setEntries(ent || []);
      setLoading(false);
    })();
  }, [sectionId]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Markt-ID holen
    const { data: mm } = await supabase
      .from("market_members")
      .select("market_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("entries").insert({
      market_id: mm?.market_id,
      section_id: sectionId,
      user_id: user.id,
      note,
    });

    if (!error) {
      setNote("");
      const { data: ent } = await supabase
        .from("entries")
        .select("*")
        .eq("section_id", sectionId)
        .order("created_at", { ascending: false });
      setEntries(ent || []);
    }
  };

  if (loading) return <main className="p-6">Lade…</main>;
  if (!section) return <main className="p-6">Nicht gefunden.</main>;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold text-mica-brand">{section.number}. {section.title}</h1>

      <form onSubmit={addEntry} className="mika-frame space-y-3">
        <textarea
          className="mika-input w-full"
          placeholder="Notiz oder Kommentar eingeben..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
        <button className="mika-btn w-full py-2 rounded-xl">Speichern</button>
      </form>

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="border rounded-lg p-3 bg-white">
            <div className="text-sm text-gray-600">
              {new Date(e.created_at).toLocaleString("de-DE")}
            </div>
            <p>{e.note}</p>
          </div>
        ))}
        {!entries.length && <p className="text-gray-500">Keine Einträge vorhanden.</p>}
      </div>
    </main>
  );
}
