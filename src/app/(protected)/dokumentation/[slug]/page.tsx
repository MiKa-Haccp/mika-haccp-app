"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getMarketId } from "@/lib/currentContext";
import UploadField from "@/components/UploadField";

type Entry = {
  id: string;
  market_id: string | null;
  section_id: string;                // = slug
  user_id: string;
  note: string | null;
  status: "offen" | "erledigt";
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  created_at: string;
};

type Section = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
};

export default function DokuSectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [section, setSection] = useState<Section | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [note, setNote] = useState("");
  const [marketId, setMarketId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"alle" | "offen" | "erledigt">("alle");

  const filtered = useMemo(() => {
    if (filter === "alle") return entries;
    return entries.filter((e) => e.status === filter);
  }, [entries, filter]);

  const loadSection = async (mid: string | null) => {
    // Markt-spezifische Sektion bevorzugen, sonst globale
    const { data, error } = await supabase
      .from("doku_sections")
      .select("id, slug, title, subtitle, market_id")
      .eq("slug", slug)
      .in("market_id", [mid, null] as any)
      .eq("enabled", true)
      .order("market_id", { ascending: false }) // zuerst markt-spezifisch
      .limit(1);

    if (error) return setSection(null);
    setSection((data?.[0] as Section) ?? null);
  };

  const loadEntries = async () => {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("section_id", slug)
      .order("created_at", { ascending: false });
    setEntries((data as Entry[]) || []);
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketId) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("entries").insert({
        market_id: marketId,
        section_id: slug,
        user_id: user.id,
        note,
        status: "offen",
      });
      setNote("");
      await loadEntries();
    } finally {
      setBusy(false);
    }
  };

  const onUploaded = async (payload: { file_path: string; file_name: string; mime_type: string }) => {
    if (!marketId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("entries").insert({
      market_id: marketId,
      section_id: slug,
      user_id: user.id,
      note: null,
      status: "offen",
      file_name: payload.file_name,
      file_path: payload.file_path,
      mime_type: payload.mime_type,
    });
    await loadEntries();
  };

  const toggleStatus = async (entry: Entry) => {
    const next = entry.status === "offen" ? "erledigt" : "offen";
    await supabase.from("entries").update({ status: next }).eq("id", entry.id);
    await loadEntries();
  };

  const getPublicUrl = (file_path: string) => {
    const { data } = supabase.storage.from("dokumente").getPublicUrl(file_path);
    return data.publicUrl;
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    (async () => {
      const mid = await getMarketId();
      if (!mounted) return;

      setMarketId(mid);
      await loadSection(mid);
      await loadEntries();

      channel = supabase
        .channel(`entries_${slug}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "entries", filter: `section_id=eq.${slug}` },
          () => loadEntries()
        )
        .subscribe();
    })();

    // SYNC Cleanup – KEIN async/await hier
    return () => {
      mounted = false;
      if (channel) {
        // bewusst nicht awaiten – Cleanup muss sync sein
        supabase.removeChannel(channel);
      }
    };
  }, [slug]);

  if (!section) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-bold">Bereich nicht gefunden</h1>
        <p className="text-gray-600 mt-2">
          Dieser Bereich ist nicht aktiv oder existiert nicht. Bitte prüfe die Einstellungen in der Admin-Ansicht.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-mica-brand">{section.title}</h1>
          {section.subtitle && <p className="text-gray-600 -mt-1">{section.subtitle}</p>}
        </div>
        <a href="/dokumentation" className="text-sm underline mt-1">Zur Übersicht</a>
      </div>

      {/* Neuer Eintrag */}
      <form onSubmit={addEntry} className="mika-frame space-y-3">
        <textarea
          className="mika-input w-full"
          placeholder={`Notiz zu ${section.title} hinzufügen...`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
        <div className="flex flex-wrap gap-3">
          <button className="mika-btn px-4 py-2 rounded-xl" disabled={busy}>
            {busy ? "Speichere..." : "Speichern"}
          </button>
          {marketId && (
            <UploadField marketId={marketId} sectionId={slug} onUploaded={onUploaded} />
          )}
        </div>
      </form>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-70">Filter:</span>
        <select
          className="mika-input text-sm w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="alle">Alle</option>
          <option value="offen">Offen</option>
          <option value="erledigt">Erledigt</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map((e) => (
          <div key={e.id} className="border rounded-xl p-4 bg-white flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {new Date(e.created_at).toLocaleString("de-DE")}
              </div>
              <button
                onClick={() => toggleStatus(e)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  e.status === "erledigt" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"
                }`}
                title="Status umschalten"
              >
                {e.status === "erledigt" ? "Erledigt" : "Offen"}
              </button>
            </div>

            {e.note && <p className="text-gray-900 whitespace-pre-wrap">{e.note}</p>}

            {e.file_path && (
              <div className="flex items-center gap-3 text-sm">
                <a
                  className="underline"
                  href={getPublicUrl(e.file_path)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {e.file_name || "Datei öffnen"}
                </a>
                {e.mime_type && <span className="text-gray-500">{e.mime_type}</span>}
              </div>
            )}
          </div>
        ))}

        {!filtered.length && (
          <p className="text-gray-500">Keine Einträge vorhanden.</p>
        )}
      </div>
    </main>
  );
}


