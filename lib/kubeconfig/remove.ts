import { getPrismaClient } from '@/lib/db'

export async function removeKubeconfig(userId: string): Promise<void> {
  const prisma = getPrismaClient()
  await prisma.kubeconfig.deleteMany({ where: { userId } })
}
