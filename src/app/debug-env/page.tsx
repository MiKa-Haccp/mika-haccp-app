// src/app/debug-env/page.tsx
export default function Page() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <main style={{padding:16}}>
      <h1>Debug Env</h1>
      <p>URL: {url || "—"}</p>
      <p>Anon Key vorhanden: {hasKey ? "ja" : "nein"}</p>
    </main>
  );
}


