import DocDetail from "./view";
export const dynamic = "force-dynamic";

// Next 16: params ist Promise
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DocDetail slug={slug} />;
}
