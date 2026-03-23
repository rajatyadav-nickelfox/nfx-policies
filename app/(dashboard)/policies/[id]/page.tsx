import { redirect } from 'next/navigation';

// Individual policy pages open as modal from the list — redirect to list
export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/policies?open=${id}`);
}
