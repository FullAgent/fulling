/**
 * @vitest-environment jsdom
 */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { detectSealosIframe, getSealosSession } = vi.hoisted(() => ({
  detectSealosIframe: vi.fn(),
  getSealosSession: vi.fn(),
}))

vi.mock('@/lib/platform/integrations/sealos/auth', () => ({
  detectSealosIframe,
  getSealosSession,
}))

import { SealosProvider, useSealos } from '@/provider/sealos'

function Deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

function createSession(input: {
  token: string
  namespaceId: string
  cleanup: () => void
}) {
  return {
    token: input.token,
    kubeconfig: 'apiVersion: v1',
    user: {
      id: 'user-id',
      name: 'sealos-user',
      avatar: '',
      k8sUsername: 'k8s-user',
      nsid: input.namespaceId,
    },
    namespaceId: input.namespaceId,
    cleanup: input.cleanup,
  }
}

function SealosStateView() {
  const sealos = useSealos()

  return (
    <output data-testid="sealos-state">
      {JSON.stringify({
        isInitialized: sealos.isInitialized,
        isLoading: sealos.isLoading,
        isSealos: sealos.isSealos,
        sealosToken: sealos.sealosToken,
        sealosNs: sealos.sealosNs,
      })}
    </output>
  )
}

describe('SealosProvider', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
    detectSealosIframe.mockReturnValue(true)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('cleans up stale sessions and still initializes after Strict Mode effect replay', async () => {
    const firstSession = Deferred<ReturnType<typeof createSession>>()
    const secondSession = Deferred<ReturnType<typeof createSession>>()
    const firstCleanup = vi.fn()
    const secondCleanup = vi.fn()

    getSealosSession
      .mockReturnValueOnce(firstSession.promise)
      .mockReturnValueOnce(secondSession.promise)

    act(() => {
      root.render(
        <SealosProvider>
          <SealosStateView />
        </SealosProvider>,
      )
    })

    act(() => {
      root.unmount()
    })

    root = createRoot(container)
    act(() => {
      root.render(
        <SealosProvider>
          <SealosStateView />
        </SealosProvider>,
      )
    })

    await act(async () => {
      firstSession.resolve(
        createSession({
          token: 'stale-token',
          namespaceId: 'stale-ns',
          cleanup: firstCleanup,
        }),
      )
    })

    expect(firstCleanup).toHaveBeenCalledTimes(1)

    await act(async () => {
      secondSession.resolve(
        createSession({
          token: 'active-token',
          namespaceId: 'active-ns',
          cleanup: secondCleanup,
        }),
      )
    })

    expect(getSealosSession).toHaveBeenCalledTimes(2)
    expect(secondCleanup).not.toHaveBeenCalled()

    const state = JSON.parse(
      container.querySelector('[data-testid="sealos-state"]')?.textContent ?? '{}',
    )

    expect(state).toEqual({
      isInitialized: true,
      isLoading: false,
      isSealos: true,
      sealosToken: 'active-token',
      sealosNs: 'active-ns',
    })

    act(() => {
      root.unmount()
    })

    expect(secondCleanup).toHaveBeenCalledTimes(1)
  })

  it('does not set fallback state after unmount when session loading fails', async () => {
    const pendingSession = Deferred<ReturnType<typeof createSession>>()
    getSealosSession.mockReturnValueOnce(pendingSession.promise)

    act(() => {
      root.render(
        <SealosProvider>
          <SealosStateView />
        </SealosProvider>,
      )
    })

    act(() => {
      root.unmount()
    })

    await act(async () => {
      pendingSession.reject(new Error('session unavailable'))
    })

    expect(getSealosSession).toHaveBeenCalledTimes(1)
    expect(container.textContent).toBe('')
  })
})
