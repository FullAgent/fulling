import { prisma } from '@/lib/db'

export async function listUserSkills(userId: string) {
  return prisma.userSkill.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findUserSkillBySkillId(userId: string, skillId: string) {
  return prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  })
}

export async function createUserSkill(input: {
  userId: string
  skillId: string
  installCommand: string
}) {
  return prisma.userSkill.create({
    data: {
      userId: input.userId,
      skillId: input.skillId,
      installCommand: input.installCommand,
    },
  })
}
