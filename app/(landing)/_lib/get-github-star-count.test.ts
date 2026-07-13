import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatGitHubStarCount, getGitHubStarCount } from './get-github-star-count'

describe('getGitHubStarCount', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the repository star count with a one-hour cache policy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ stargazers_count: 2418 }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getGitHubStarCount()).resolves.toBe(2418)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/FullAgent/fulling',
      expect.objectContaining({
        next: {
          revalidate: 3600,
        },
      }),
    )
  })

  it('falls back to the last known compact value when GitHub is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('GitHub unavailable')))

    await expect(getGitHubStarCount()).resolves.toBe(2400)
  })
})

describe('formatGitHubStarCount', () => {
  it.each([
    [999, '999'],
    [2400, '2.4K'],
    [25_000, '25K'],
  ])('formats %i as %s', (starCount, expected) => {
    expect(formatGitHubStarCount(starCount)).toBe(expected)
  })
})
