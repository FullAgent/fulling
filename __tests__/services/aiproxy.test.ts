/**
 * Unit tests for loadEnvVarsForSandbox service
 *
 * Tests that MiniMax env vars are correctly loaded and mapped
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    userConfig: {
      findMany: vi.fn(),
    },
  },
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

import { prisma } from '@/lib/db'

describe('loadEnvVarsForSandbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load MiniMax env vars alongside Anthropic', async () => {
    const mockConfigs = [
      { key: 'ANTHROPIC_API_KEY', value: 'sk-ant-test' },
      { key: 'ANTHROPIC_API', value: 'https://api.anthropic.com' },
      { key: 'ANTHROPIC_MODEL', value: 'claude-sonnet-4-5-20250929' },
      { key: 'ANTHROPIC_SMALL_FAST_MODEL', value: 'claude-3-5-haiku-20241022' },
      { key: 'MINIMAX_API_KEY', value: 'minimax-test-key' },
      { key: 'MINIMAX_API', value: 'https://api.minimax.io/v1' },
      { key: 'MINIMAX_MODEL', value: 'MiniMax-M2.7' },
    ]
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue(mockConfigs as never)

    const { loadEnvVarsForSandbox } = await import('@/lib/services/aiproxy')
    const envVars = await loadEnvVarsForSandbox('test-user-id')

    // Anthropic vars
    expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('sk-ant-test')
    expect(envVars.ANTHROPIC_BASE_URL).toBe('https://api.anthropic.com')
    expect(envVars.ANTHROPIC_MODEL).toBe('claude-sonnet-4-5-20250929')
    expect(envVars.ANTHROPIC_SMALL_FAST_MODEL).toBe('claude-3-5-haiku-20241022')

    // MiniMax vars
    expect(envVars.MINIMAX_API_KEY).toBe('minimax-test-key')
    expect(envVars.MINIMAX_BASE_URL).toBe('https://api.minimax.io/v1')
    expect(envVars.MINIMAX_MODEL).toBe('MiniMax-M2.7')
  })

  it('should return only Anthropic vars when no MiniMax config exists', async () => {
    const mockConfigs = [
      { key: 'ANTHROPIC_API_KEY', value: 'sk-ant-test' },
      { key: 'ANTHROPIC_API', value: 'https://api.anthropic.com' },
    ]
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue(mockConfigs as never)

    const { loadEnvVarsForSandbox } = await import('@/lib/services/aiproxy')
    const envVars = await loadEnvVarsForSandbox('test-user-id')

    expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('sk-ant-test')
    expect(envVars.MINIMAX_API_KEY).toBeUndefined()
    expect(envVars.MINIMAX_BASE_URL).toBeUndefined()
    expect(envVars.MINIMAX_MODEL).toBeUndefined()
  })

  it('should return only MiniMax vars when no Anthropic config exists', async () => {
    const mockConfigs = [
      { key: 'MINIMAX_API_KEY', value: 'minimax-test-key' },
      { key: 'MINIMAX_API', value: 'https://api.minimax.io/v1' },
      { key: 'MINIMAX_MODEL', value: 'MiniMax-M2.5-highspeed' },
    ]
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue(mockConfigs as never)

    const { loadEnvVarsForSandbox } = await import('@/lib/services/aiproxy')
    const envVars = await loadEnvVarsForSandbox('test-user-id')

    expect(envVars.ANTHROPIC_AUTH_TOKEN).toBeUndefined()
    expect(envVars.MINIMAX_API_KEY).toBe('minimax-test-key')
    expect(envVars.MINIMAX_BASE_URL).toBe('https://api.minimax.io/v1')
    expect(envVars.MINIMAX_MODEL).toBe('MiniMax-M2.5-highspeed')
  })

  it('should return empty object when no configs exist', async () => {
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue([] as never)

    const { loadEnvVarsForSandbox } = await import('@/lib/services/aiproxy')
    const envVars = await loadEnvVarsForSandbox('test-user-id')

    expect(Object.keys(envVars)).toHaveLength(0)
  })

  it('should query database with MiniMax keys included', async () => {
    vi.mocked(prisma.userConfig.findMany).mockResolvedValue([] as never)

    const { loadEnvVarsForSandbox } = await import('@/lib/services/aiproxy')
    await loadEnvVarsForSandbox('test-user-id')

    expect(prisma.userConfig.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'test-user-id',
        key: {
          in: expect.arrayContaining([
            'MINIMAX_API_KEY',
            'MINIMAX_API',
            'MINIMAX_MODEL',
          ]),
        },
      },
    })
  })
})
