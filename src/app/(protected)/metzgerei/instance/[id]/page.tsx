// src/app/(protected)/metzgerei/instance/[id]/page.tsx
import FormEditor from "./FormEditor";

export const dynamic = "force-dynamic";

// In React 19/Next 16 sind params ein Promise:
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FormEditor id={id} />;
}

