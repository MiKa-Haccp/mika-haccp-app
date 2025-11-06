"use client";
import { supabase } from "@/lib/supabaseClient";

/**
 * Aktive market_id:
 * 1) bevorzugt localStorage('activeMarketId') – aber nur, wenn Mitgliedschaft existiert
 * 2) sonst irgendeine (erste) Mitgliedschaft
 * Speichert Fallback in localStorage
 */
export async function getMarketId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) preferred aus localStorage validieren
  let preferred: string | null = null;
  try { preferred = typeof window !== "undefined" ? localStorage.getItem("activeMarketId") : null; } catch {}
  if (preferred) {
    const { data: ok } = await supabase
      .from("market_members")
      .select("market_id")
      .eq("user_id", user.id)
      .eq("market_id", preferred)
      .limit(1)
      .maybeSingle();
    if (ok?.market_id) return ok.market_id as string;
  }

  // 2) irgendeine Mitgliedschaft (kein created_at nötig)
  const { data, error } = await supabase
    .from("market_members")
    .select("market_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error || !data) return null;

  try { if (typeof window !== "undefined") localStorage.setItem("activeMarketId", data.market_id as string); } catch {}
  return data.market_id as string;
}

/** Admin-Flag (globale Rechte) */
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_flags")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data?.is_admin);
}


