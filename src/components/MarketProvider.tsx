"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Ctx = { marketName: string | null; marketId: string | null; hasMarket: boolean; loading: boolean };
const MarketCtx = createContext<Ctx>({ marketName: null, marketId: null, hasMarket: false, loading: true });

export function useMarket() { return useContext(MarketCtx); }

export default function MarketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Ctx>({ marketName: null, marketId: null, hasMarket: false, loading: true });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState({ marketName: null, marketId: null, hasMarket: false, loading: false }); return; }

      const { data: mm } = await supabase
        .from("market_members")
        .select("market_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mm) { setState({ marketName: null, marketId: null, hasMarket: false, loading: false }); return; }

      const { data: mkt } = await supabase
        .from("markets")
        .select("id,name")
        .eq("id", mm.market_id)
        .single();

      setState({
        marketName: mkt?.name ?? null,
        marketId: mkt?.id ?? null,
        hasMarket: !!mkt,
        loading: false,
      });
    })();
  }, []);

  return <MarketCtx.Provider value={state}>{children}</MarketCtx.Provider>;
}
