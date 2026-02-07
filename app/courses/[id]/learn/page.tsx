import { redirect } from 'next/navigation';

export default async function CoursesLearnIndexRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/courses/${id}/learn`);
}
