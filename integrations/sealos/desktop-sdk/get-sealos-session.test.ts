import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSealosApp, sealosApp } = vi.hoisted(() => ({
  createSealosApp: vi.fn(),
  sealosApp: {
    getSession: vi.fn(),
  },
}))

vi.mock('@zjy365/sealos-desktop-sdk/app', () => ({
  createSealosApp,
  sealosApp,
}))

import { getSealosSession } from '@/integrations/sealos/desktop-sdk/get-sealos-session'

describe('getSealosSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes the SDK and returns a normalized Sealos auth session', async () => {
    const cleanup = vi.fn()
    createSealosApp.mockReturnValue(cleanup)
    sealosApp.getSession.mockResolvedValue({
      token: 'sealos-token',
      kubeconfig: 'apiVersion: v1',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: 'https://example.com/avatar.png',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
    })

    const result = await getSealosSession()

    expect(result).toEqual({
      token: 'sealos-token',
      kubeconfig: 'apiVersion: v1',
      namespaceId: 'ns-user',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: 'https://example.com/avatar.png',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
      cleanup,
    })
    expect(createSealosApp).toHaveBeenCalledTimes(1)
    expect(sealosApp.getSession).toHaveBeenCalledTimes(1)
  })

  it('uses a no-op cleanup when the SDK initializer returns nothing', async () => {
    createSealosApp.mockReturnValue(undefined)
    sealosApp.getSession.mockResolvedValue({
      token: 'sealos-token',
      kubeconfig: 'apiVersion: v1',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: '',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
    })

    const result = await getSealosSession()

    expect(() => result.cleanup()).not.toThrow()
  })

  it('rethrows session loading errors from the SDK', async () => {
    const error = new Error('session unavailable')
    const cleanup = vi.fn()
    createSealosApp.mockReturnValue(cleanup)
    sealosApp.getSession.mockRejectedValue(error)

    await expect(getSealosSession()).rejects.toThrow(error)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('cleans up and throws a clear error when the session token is missing', async () => {
    const cleanup = vi.fn()
    createSealosApp.mockReturnValue(cleanup)
    sealosApp.getSession.mockResolvedValue({
      kubeconfig: 'apiVersion: v1',
      user: {
        id: 'user-id',
        name: 'sealos-user',
        avatar: '',
        k8sUsername: 'k8s-user',
        nsid: 'ns-user',
      },
    })

    await expect(getSealosSession()).rejects.toThrow(
      'Sealos session token is missing',
    )
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
