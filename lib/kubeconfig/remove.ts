import { prisma } from '@/lib/db'

export async function removeKubeconfig(userId: string): Promise<void> {
  await prisma.kubeconfig.deleteMany({ where: { userId } })
}
