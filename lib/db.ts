import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/lib/generated/prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export function getPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize Prisma.')
  }

  const prisma = global.prisma ?? createPrismaClient(databaseUrl)

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
  }

  return prisma
}
