// Achtung: params ist eine Promise – wir müssen await benutzen
export default async function DokuMetzgereiSectionPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: { marketId?: string };
}) {
  const { slug } = await props.params;
  const marketId = (props.searchParams?.marketId || "").trim();

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-xl font-bold">Metzgerei · {slug}</h1>
      <p className="text-sm opacity-70">
        {marketId ? `Markt: ${marketId}` : "Global / alle Märkte"}
      </p>
      {/* Hier könnte später die echte Doku-Ansicht pro Section kommen */}
      <div className="rounded-2xl border p-4">
        <div className="opacity-70 text-sm">Doku-Ansicht folgt.</div>
      </div>
    </main>
  );
}
