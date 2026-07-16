import { getPrismaClient } from '@/lib/db'

export async function getKubeconfigContent(userId: string): Promise<string | null> {
  const prisma = getPrismaClient()
  const kubeconfig = await prisma.kubeconfig.findUnique({
    where: { userId },
    select: { content: true },
  })

  return kubeconfig?.content ?? null
}
