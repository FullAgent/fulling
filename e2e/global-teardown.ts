import { PrismaClient } from '@prisma/client'

import { E2E_USER_ID } from './global-setup'

export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) {
    return
  }

  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
  try {
    await prisma.user.deleteMany({ where: { id: E2E_USER_ID } })
  } finally {
    await prisma.$disconnect()
  }
}
