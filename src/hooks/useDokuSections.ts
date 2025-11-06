"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getMarketId } from "@/lib/currentContext";

export type DokuSection = {
  id: string;
  market_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  enabled: boolean;
};

export function useDokuSections() {
  const [sections, setSections] = useState<DokuSection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const marketId = await getMarketId();

    let q = supabase
      .from("doku_sections")
      .select("*")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (marketId) {
      q = q.or(`market_id.eq.${marketId},market_id.is.null`);
    } else {
      q = q.is("market_id", null);
    }

    const { data, error } = await q;
    if (!error) setSections((data as DokuSection[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("doku_sections_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "doku_sections" }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  return { sections, loading, reload: load };
}



