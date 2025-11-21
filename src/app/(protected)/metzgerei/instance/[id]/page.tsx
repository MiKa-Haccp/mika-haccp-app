import FormEditor from "./FormEditor";
export const dynamic = "force-dynamic";

// Next 16: params ist ein Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormEditor id={id} />;
}
