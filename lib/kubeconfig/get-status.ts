import { prisma } from '@/lib/db'

import type { KubeconfigStatus } from './errors'

export async function getKubeconfigStatus(userId: string): Promise<KubeconfigStatus> {
  const kubeconfig = await prisma.kubeconfig.findUnique({
    where: { userId },
    select: { updatedAt: true },
  })

  return {
    configured: kubeconfig !== null,
    updatedAt: kubeconfig?.updatedAt ?? null,
  }
}
