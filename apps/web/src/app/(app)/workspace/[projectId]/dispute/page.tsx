import { DisputeScreen } from '@/components/aperto/screens/dispute-screen';

export default async function DisputePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <DisputeScreen projectId={projectId} />;
}
