import FormEditor from "./FormEditor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // <- wichtig bei Next 16
  return <FormEditor id={id} />;
}
