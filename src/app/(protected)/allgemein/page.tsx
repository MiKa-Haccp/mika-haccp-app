"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Section = { id: string; title: string; number: number; space_id: string };

export default function AllgemeinPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Markt-ID des Nutzers
      const { data: mm } = await supabase
        .from("market_members")
        .select("market_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mm) { setLoading(false); return; }

      // Space „allgemein“ holen → ID
      const { data: sp } = await supabase
        .from("spaces")
        .select("id")
        .eq("market_id", mm.market_id)
        .eq("key", "allgemein")
        .maybeSingle();
      if (!sp) { setLoading(false); return; }

      // Sections zu diesem Space
      const { data: sec } = await supabase
        .from("sections")
        .select("*")
        .eq("market_id", mm.market_id)
        .eq("space_id", sp.id)
        .order("number", { ascending: true });

      setSections(sec || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="p-6">Lade…</main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-extrabold mb-4"><span className="mika-brand">Allgemein</span></h1>
      <ul className="space-y-2">
        {sections.map(s => (
          <li key={s.id}>
            <a
              href={`/sections/${s.id}`}
              className="block rounded-lg border p-3 bg-white hover:bg-mica-bg/10"
            >
              {s.number}. {s.title}
            </a>
          </li>
        ))}
        {!sections.length && <li className="text-gray-500">Keine Einträge vorhanden.</li>}
      </ul>
    </main>
  );
}
