import { prismaAdapter } from '@better-auth/prisma-adapter'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

import { prisma } from '@/lib/db'
import { env } from '@/lib/env'

function createAuth() {
  const {
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: baseURL,
    DATABASE_URL: databaseUrl,
    GITHUB_CLIENT_ID: clientId,
    GITHUB_CLIENT_SECRET: clientSecret,
  } = env

  if (!baseURL || !secret || !databaseUrl || !clientId || !clientSecret) {
    return null
  }

  return betterAuth({
    baseURL,
    secret,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    session: {
      cookieCache: {
        enabled: false,
      },
    },
    socialProviders: {
      github: {
        clientId,
        clientSecret,
      },
    },
    plugins: [nextCookies()],
  })
}

export const auth = createAuth()
export const isAuthConfigured = auth !== null
