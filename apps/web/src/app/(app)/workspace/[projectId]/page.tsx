import { WorkspaceShell } from '@/components/aperto/screens/workspace-shell';

export default async function WorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <WorkspaceShell projectId={projectId} />;
}
