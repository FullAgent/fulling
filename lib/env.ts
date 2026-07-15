import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.url().optional(),
    BETTER_AUTH_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    LOG_LEVEL: z.string().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
})
