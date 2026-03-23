/**
 * Unit tests for MiniMax Configuration API
 *
 * Tests the GET and POST endpoints at /api/user/config/minimax
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    userConfig: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<void>) =>
      fn({
        userConfig: {
          upsert: vi.fn(),
          deleteMany: vi.fn(),
        },
      })
    ),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
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

// Mock withAuth to pass through session
vi.mock('@/lib/api-auth', () => ({
  withAuth: (handler: Function) => {
    return async (req: Request) => {
      const session = { user: { id: 'test-user-id' } }
      return handler(req, { params: Promise.resolve({}) }, session)
    }
  },
}))

import { prisma } from '@/lib/db'

describe('GET /api/user/config/minimax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return MiniMax configuration when configs exist', async () => {
    const mockConfigs = [
      { key: 'MINIMAX_API_KEY', value: 'test-api-key' },
      { key: 'MINIMAX_API', value: 'https://api.minimax.io/v1' },
      { key: 'MINIMAX_MODEL', value: 'MiniMax-M2.7' },
    ]
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue(mockConfigs as never)

    const { GET } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax')
    const response = await GET(req as never, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(data.apiKey).toBe('test-api-key')
    expect(data.apiBaseUrl).toBe('https://api.minimax.io/v1')
    expect(data.model).toBe('MiniMax-M2.7')
  })

  it('should return nulls when no configs exist', async () => {
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue([] as never)

    const { GET } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax')
    const response = await GET(req as never, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(data.apiKey).toBeNull()
    expect(data.apiBaseUrl).toBeNull()
    expect(data.model).toBeNull()
  })

  it('should return 500 on database error', async () => {
    vi.mocked(prisma.userConfig.findMany).mockRejectedValue(new Error('DB error') as never)

    const { GET } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax')
    const response = await GET(req as never, { params: Promise.resolve({}) })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch MiniMax configuration')
  })
})

describe('POST /api/user/config/minimax', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save MiniMax configuration successfully', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: 'test-api-key',
        model: 'MiniMax-M2.7',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req as never, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.message).toBe('MiniMax configuration saved successfully')
  })

  it('should reject missing API base URL', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: '',
        apiKey: 'test-api-key',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req as never, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('API base URL is required')
  })

  it('should reject missing API key', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: '',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req as never, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('API key is required')
  })

  it('should reject invalid URL format', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'not-a-url',
        apiKey: 'test-api-key',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req as never, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid API base URL format')
  })

  it('should handle optional model being empty (delete config)', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: 'test-api-key',
        model: '',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req as never, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(data.success).toBe(true)
  })

  it('should save without optional model field', async () => {
    const { POST } = await import('@/app/api/user/config/minimax/route')
    const req = new Request('http://localhost/api/user/config/minimax', {
      method: 'POST',
      body: JSON.stringify({
        apiBaseUrl: 'https://api.minimax.io/v1',
        apiKey: 'test-api-key',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req as never, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(data.success).toBe(true)
  })
})
