import { cache } from 'react'

import { prisma } from '@/lib/db'

export const getUserSkills = cache(async function getUserSkills(userId: string) {
  return prisma.userSkill.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
})
