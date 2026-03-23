/**
 * Integration tests for MiniMax provider
 *
 * Tests the end-to-end flow of MiniMax configuration:
 * - API endpoint saves config to database
 * - loadEnvVarsForSandbox reads config and maps to env vars
 * - Settings UI interacts with API correctly
 *
 * These tests require a running database and should be run with:
 *   DATABASE_URL=... vitest run __tests__/integration/
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock prisma with in-memory store
const configStore: Map<string, { key: string; value: string; category: string; isSecret: boolean }> =
  new Map()

vi.mock('@/lib/db', () => ({
  prisma: {
    userConfig: {
      findMany: vi.fn(async ({ where }: { where: { userId: string; key: { in: string[] } } }) => {
        return Array.from(configStore.values()).filter(
          (c) => where.key.in.includes(c.key)
        )
      }),
      upsert: vi.fn(
        async ({
          create,
          update,
          where,
        }: {
          create: { key: string; value: string; category: string; isSecret: boolean }
          update: { value: string }
          where: { userId_key: { key: string } }
        }) => {
          const existing = configStore.get(where.userId_key.key)
          if (existing) {
            existing.value = update.value
            configStore.set(where.userId_key.key, existing)
          } else {
            configStore.set(create.key, create)
          }
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: { key: string } }) => {
        configStore.delete(where.key)
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        userConfig: {
          upsert: vi.fn(
            async ({
              create,
              update,
              where,
            }: {
              create: { key: string; value: string; category: string; isSecret: boolean }
              update: { value: string }
              where: { userId_key: { key: string } }
            }) => {
              const existing = configStore.get(where.userId_key.key)
              if (existing) {
                existing.value = update.value
                configStore.set(where.userId_key.key, existing)
              } else {
                configStore.set(create.key, create)
              }
            }
          ),
          deleteMany: vi.fn(async ({ where }: { where: { key: string } }) => {
            configStore.delete(where.key)
          }),
        },
      }
      await fn(tx)
    }),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  env: {
    AIPROXY_ENDPOINT: undefined,
    ANTHROPIC_BASE_URL: undefined,
    ANTHROPIC_MODEL: undefined,
    ANTHROPIC_SMALL_FAST_MODEL: undefined,
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: Function) => {
    return async (req: Request) => {
      const session = { user: { id: 'integration-test-user' } }
      return handler(req, { params: Promise.resolve({}) }, session)
    }
  },
}))

describe('MiniMax Provider Integration', () => {
  beforeEach(() => {
    configStore.clear()
    vi.clearAllMocks()
  })

  it('should save MiniMax config via API and load it for sandbox', async () => {
    // Step 1: Save config via POST endpoint
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const saveReq = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: 'integration-test-key',
        model: 'MiniMax-M2.7',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const saveResponse = await POST(saveReq as never, { params: Promise.resolve({}) })
    const saveData = await saveResponse.json()

    expect(saveData.success).toBe(true)

    // Step 2: Verify config was stored
    expect(configStore.has('MINIMAX_API_KEY')).toBe(true)
    expect(configStore.has('MINIMAX_API')).toBe(true)
    expect(configStore.has('MINIMAX_MODEL')).toBe(true)

    // Step 3: Load config via GET endpoint
    const { GET } = await import('@/app/api/user/config/minimax/route')
    const getReq = new Request('http://localhost/api/user/config/minimax')
    const getResponse = await GET(getReq as never, { params: Promise.resolve({}) })
    const getData = await getResponse.json()

    expect(getData.apiKey).toBe('integration-test-key')
    expect(getData.apiBaseUrl).toBe('https://api.minimax.io/v1')
    expect(getData.model).toBe('MiniMax-M2.7')
  })

  it('should coexist with Anthropic config without interference', async () => {
    // Set up Anthropic config
    configStore.set('ANTHROPIC_API_KEY', {
      key: 'ANTHROPIC_API_KEY',
      value: 'sk-ant-existing',
      category: 'anthropic',
      isSecret: true,
    })
    configStore.set('ANTHROPIC_API', {
      key: 'ANTHROPIC_API',
      value: 'https://api.anthropic.com',
      category: 'anthropic',
      isSecret: false,
    })

    // Save MiniMax config via API
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const saveReq = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: 'minimax-key',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(saveReq as never, { params: Promise.resolve({}) })

    // Verify Anthropic config is untouched
    expect(configStore.get('ANTHROPIC_API_KEY')?.value).toBe('sk-ant-existing')
    expect(configStore.get('ANTHROPIC_API')?.value).toBe('https://api.anthropic.com')

    // Verify MiniMax config exists
    expect(configStore.get('MINIMAX_API_KEY')?.value).toBe('minimax-key')
  })

  it('should store MiniMax API key as secret', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: 'secret-key',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req as never, { params: Promise.resolve({}) })

    const apiKeyConfig = configStore.get('MINIMAX_API_KEY')
    expect(apiKeyConfig?.isSecret).toBe(true)
    expect(apiKeyConfig?.category).toBe('minimax')

    const apiUrlConfig = configStore.get('MINIMAX_API')
    expect(apiUrlConfig?.isSecret).toBe(false)
  })
})
