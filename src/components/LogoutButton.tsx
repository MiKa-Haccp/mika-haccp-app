"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
      }}
      className="text-sm text-gray-600 underline hover:text-red-600"
    >
      Logout
    </button>
  );
}
