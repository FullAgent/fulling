import { getPrismaClient } from '@/lib/db'

export async function saveKubeconfig(userId: string, content: string): Promise<Date> {
  const prisma = getPrismaClient()
  const kubeconfig = await prisma.kubeconfig.upsert({
    where: { userId },
    create: { userId, content },
    update: { content },
    select: { updatedAt: true },
  })

  return kubeconfig.updatedAt
}
