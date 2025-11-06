"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type MyMarket = { id: string; name: string };

export function useMyMarkets() {
  const [markets, setMarkets] = useState<MyMarket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // 1) Mitgliedschaften holen (market_ids)
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id ?? "";
    const { data: mm, error: e1 } = await supabase
      .from("market_members")
      .select("market_id")
      .eq("user_id", uid)
      .limit(1000);

    if (e1 || !mm || mm.length === 0) {
      setMarkets([]); setLoading(false); return;
    }
    const ids = Array.from(new Set(mm.map(r => r.market_id as string)));

    // 2) Namen aus markets per IN(...) holen
    const { data: mk, error: e2 } = await supabase
      .from("markets")
      .select("id,name")
      .in("id", ids);

    const map = new Map((mk || []).map((m: any) => [m.id, (m.name ?? "").toString()]));
    const list: MyMarket[] = ids.map(id => ({ id, name: map.get(id) || id }));
    setMarkets(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return { markets, loading, reload: load };
}
