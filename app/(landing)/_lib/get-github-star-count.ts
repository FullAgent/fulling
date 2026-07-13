import { z } from 'zod'

const FALLBACK_STAR_COUNT = 2400
const GITHUB_REPOSITORY_API = 'https://api.github.com/repos/FullAgent/fulling'
const ONE_HOUR_IN_SECONDS = 60 * 60

const githubRepositorySchema = z.object({
  stargazers_count: z.number().int().nonnegative(),
})

export async function getGitHubStarCount(): Promise<number> {
  try {
    const response = await fetch(GITHUB_REPOSITORY_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'fulling-landing-page',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: {
        revalidate: ONE_HOUR_IN_SECONDS,
      },
    })

    if (!response.ok) {
      return FALLBACK_STAR_COUNT
    }

    const repository = githubRepositorySchema.safeParse(await response.json())

    return repository.success ? repository.data.stargazers_count : FALLBACK_STAR_COUNT
  } catch {
    return FALLBACK_STAR_COUNT
  }
}

export function formatGitHubStarCount(starCount: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(starCount)
}
