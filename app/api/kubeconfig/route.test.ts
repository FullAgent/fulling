import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidKubeconfigError } from '@/lib/kubeconfig'

import { DELETE, GET, PUT } from './route'

const mocks = vi.hoisted(() => ({
  getKubeconfigStatus: vi.fn(),
  getSession: vi.fn(),
  removeKubeconfig: vi.fn(),
  saveKubeconfig: vi.fn(),
  validateKubeconfig: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }))
vi.mock('@/lib/kubeconfig', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/kubeconfig')>()
  return {
    ...actual,
    getKubeconfigStatus: mocks.getKubeconfigStatus,
    removeKubeconfig: mocks.removeKubeconfig,
    saveKubeconfig: mocks.saveKubeconfig,
  }
})
vi.mock('@/lib/k8s', () => ({ validateKubeconfig: mocks.validateKubeconfig }))
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

const session = {
  user: { id: 'user-1', name: 'Test', email: 'test@example.com', image: null },
}

describe('/api/kubeconfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue(session)
  })

  it.each([
    ['GET', () => GET()],
    ['PUT', () => PUT(new Request('http://localhost/api/kubeconfig', { method: 'PUT' }))],
    ['DELETE', () => DELETE()],
  ])('returns 401 for anonymous %s requests', async (_method, call) => {
    mocks.getSession.mockResolvedValue(null)

    const response = await call()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('returns status without kubeconfig content', async () => {
    mocks.getKubeconfigStatus.mockResolvedValue({
      configured: true,
      updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    })

    const response = await GET()
    const body = await response.json()

    expect(body).toEqual({ configured: true, updatedAt: '2026-07-13T12:00:00.000Z' })
    expect(body).not.toHaveProperty('content')
  })

  it('does not save a kubeconfig that fails validation', async () => {
    mocks.validateKubeconfig.mockRejectedValue(new InvalidKubeconfigError('Invalid config.'))

    const response = await PUT(
      new Request('http://localhost/api/kubeconfig', {
        method: 'PUT',
        body: JSON.stringify({ content: 'invalid' }),
      })
    )

    expect(response.status).toBe(400)
    expect(mocks.saveKubeconfig).not.toHaveBeenCalled()
  })

  it('saves only after successful validation', async () => {
    mocks.validateKubeconfig.mockResolvedValue({
      apiServerOrigin: 'https://cluster.example.com',
      namespace: 'default',
      username: 'test-user',
    })
    mocks.saveKubeconfig.mockResolvedValue(new Date('2026-07-13T12:00:00.000Z'))

    const response = await PUT(
      new Request('http://localhost/api/kubeconfig', {
        method: 'PUT',
        body: JSON.stringify({ content: 'valid-config' }),
      })
    )

    expect(mocks.saveKubeconfig).toHaveBeenCalledWith('user-1', 'valid-config')
    await expect(response.json()).resolves.toEqual({
      configured: true,
      updatedAt: '2026-07-13T12:00:00.000Z',
    })
  })

  it('delegates idempotent deletion by user ID', async () => {
    mocks.removeKubeconfig.mockResolvedValue(undefined)

    const response = await DELETE()

    expect(mocks.removeKubeconfig).toHaveBeenCalledWith('user-1')
    await expect(response.json()).resolves.toEqual({ configured: false, updatedAt: null })
  })
})
