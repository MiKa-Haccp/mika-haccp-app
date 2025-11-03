"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!data.session) {
        router.replace("/login");
      } else {
        setStatus("ok");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-gray-600">
        Prüfe Anmeldung…
      </div>
    );
  }

  return <>{children}</>;
}
