"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  marketId: string;
  sectionId: string; // z. B. "schulungen", "formulare"
  onUploaded: (payload: {
    file_path: string;
    file_name: string;
    mime_type: string;
  }) => void;
};

export default function UploadField({ marketId, sectionId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !marketId) return;
    setBusy(true);
    setError(null);
    try {
      const uuid = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${marketId}/${sectionId}/${uuid}-${f.name}`;
      const { error: upErr } = await supabase.storage.from("dokumente").upload(path, f, {
        upsert: false,
        contentType: f.type || undefined,
      });
      if (upErr) throw upErr;
      onUploaded({ file_path: path, file_name: f.name, mime_type: f.type || "application/octet-stream" });
    } catch (err: any) {
      setError(err?.message || "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFile}
        accept="application/pdf,image/*"
      />
      <button
        type="button"
        onClick={handlePick}
        className="mika-btn px-4 py-2 rounded-xl disabled:opacity-50"
        disabled={busy}
      >
        {busy ? "Lade hoch..." : "Datei auswählen"}
      </button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
}
