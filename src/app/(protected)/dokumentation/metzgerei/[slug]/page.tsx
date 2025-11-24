export const dynamic = "force-dynamic";

export default async function DokuSectionPage({
  params,
  searchParams,
}: { params: { slug: string }, searchParams?: { marketId?: string } }) {
  const section = params.slug;
  const marketId = (searchParams?.marketId || "").trim();
  // ... fetch(`/api/dokumentation/metzgerei/${section}?marketId=${marketId}`)
}
