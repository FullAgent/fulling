import type { FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { createHmac } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

export const E2E_USER_ID = 'e2e-user'
export const E2E_SESSION_ID = 'e2e-session'
export const E2E_SESSION_TOKEN = 'e2e-session-token'

function signCookie(value: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(value).digest('base64')
  return `${value}.${signature}`
}

export default async function globalSetup(config: FullConfig) {
  const databaseUrl = process.env.DATABASE_URL
  const secret = process.env.BETTER_AUTH_SECRET
  if (!databaseUrl || !secret) {
    throw new Error('Playwright requires DATABASE_URL and BETTER_AUTH_SECRET for an isolated test database.')
  }

  const baseURL = config.projects[0]?.use.baseURL
  if (typeof baseURL !== 'string') {
    throw new Error('Playwright requires a configured baseURL.')
  }

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl })
  try {
    await prisma.kubeconfig.deleteMany({ where: { userId: E2E_USER_ID } })
    await prisma.session.deleteMany({ where: { userId: E2E_USER_ID } })
    await prisma.user.upsert({
      where: { id: E2E_USER_ID },
      create: {
        id: E2E_USER_ID,
        name: 'Fulling Test User',
        email: 'e2e@example.com',
        emailVerified: true,
      },
      update: {
        name: 'Fulling Test User',
        email: 'e2e@example.com',
      },
    })
    await prisma.session.create({
      data: {
        id: E2E_SESSION_ID,
        token: E2E_SESSION_TOKEN,
        userId: E2E_USER_ID,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
  } finally {
    await prisma.$disconnect()
  }

  const origin = new URL(baseURL)
  await mkdir('e2e/.auth', { recursive: true })
  await writeFile(
    'e2e/.auth/state.json',
    JSON.stringify({
      cookies: [
        {
          name: 'better-auth.session_token',
          value: signCookie(E2E_SESSION_TOKEN, secret),
          domain: origin.hostname,
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600,
          httpOnly: true,
          secure: origin.protocol === 'https:',
          sameSite: 'Lax',
        },
      ],
      origins: [],
    })
  )
}
