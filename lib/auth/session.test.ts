import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authState, getSessionMock, headersMock, redirectMock } = vi.hoisted(() => {
  const getSessionMock = vi.fn()
  return {
    authState: {
      current: { api: { getSession: getSessionMock } } as null | {
        api: { getSession: typeof getSessionMock }
      },
    },
    getSessionMock,
    headersMock: vi.fn(),
    redirectMock: vi.fn(),
  }
})

vi.mock('./config', () => ({
  get auth() {
    return authState.current
  },
}))

vi.mock('next/headers', () => ({
  headers: headersMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import {
  getSession,
  requireApiSession,
  requireSession,
  UnauthorizedError,
} from './session'

const betterAuthSession = {
  session: {
    id: 'session-id',
    token: 'session-token',
    userId: 'user-id',
    expiresAt: new Date('2026-08-01T00:00:00.000Z'),
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
    ipAddress: null,
    userAgent: null,
  },
  user: {
    id: 'user-id',
    name: 'Octo Cat',
    email: 'octocat@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date('2026-07-13T00:00:00.000Z'),
    updatedAt: new Date('2026-07-13T00:00:00.000Z'),
  },
}

const appSession = {
  user: {
    id: 'user-id',
    name: 'Octo Cat',
    email: 'octocat@example.com',
    image: null,
  },
}

describe('session helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.current = { api: { getSession: getSessionMock } }
  })

  it('returns null without reading request headers when auth is not configured', async () => {
    authState.current = null

    await expect(getSession()).resolves.toBeNull()
    expect(headersMock).not.toHaveBeenCalled()
    expect(getSessionMock).not.toHaveBeenCalled()
  })

  it('passes request headers and returns only application user fields', async () => {
    const requestHeaders = new Headers({ cookie: 'better-auth.session_token=token' })
    headersMock.mockResolvedValue(requestHeaders)
    getSessionMock.mockResolvedValue(betterAuthSession)

    await expect(getSession()).resolves.toEqual(appSession)
    expect(getSessionMock).toHaveBeenCalledWith({ headers: requestHeaders })
  })

  it('returns null when Better Auth has no session', async () => {
    headersMock.mockResolvedValue(new Headers())
    getSessionMock.mockResolvedValue(null)

    await expect(getSession()).resolves.toBeNull()
  })

  it('returns the authenticated application session for pages', async () => {
    headersMock.mockResolvedValue(new Headers())
    getSessionMock.mockResolvedValue(betterAuthSession)

    await expect(requireSession()).resolves.toEqual(appSession)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated page requests to login', async () => {
    headersMock.mockResolvedValue(new Headers())
    getSessionMock.mockResolvedValue(null)
    redirectMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    await expect(requireSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('returns the authenticated application session for APIs', async () => {
    headersMock.mockResolvedValue(new Headers())
    getSessionMock.mockResolvedValue(betterAuthSession)

    await expect(requireApiSession()).resolves.toEqual(appSession)
  })

  it('throws a mappable 401 error for unauthenticated APIs', async () => {
    headersMock.mockResolvedValue(new Headers())
    getSessionMock.mockResolvedValue(null)

    const error = await requireApiSession().catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(error).toMatchObject({ name: 'UnauthorizedError', status: 401 })
  })
})
