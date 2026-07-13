import { requireSession } from '@/lib/auth/session'

import { WorkspaceOverview } from './_components/workspace-overview'

export default async function WorkspacePage() {
  const { user } = await requireSession()
  return <WorkspaceOverview user={{ name: user.name, email: user.email, image: user.image ?? null }} />
}
