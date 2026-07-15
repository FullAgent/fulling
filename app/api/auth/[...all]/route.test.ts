import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: null }))

import { GET, POST } from './route'

describe('/api/auth/[...all]', () => {
  it.each([
    ['GET', GET],
    ['POST', POST],
  ])('returns an explicit unavailable response for %s without auth configuration', async (_method, handler) => {
    const response = await handler()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: 'AUTH_UNAVAILABLE',
      message: 'Authentication is not configured.',
    })
  })
})
