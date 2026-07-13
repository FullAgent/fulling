import { getSession } from '@/lib/auth/session'

import { LandingClient } from './_components/landing-client'
import { formatGitHubStarCount, getGitHubStarCount } from './_lib/get-github-star-count'

export default async function LandingPage() {
  const [session, githubStarCount] = await Promise.all([
    getSession(),
    getGitHubStarCount(),
  ])

  return (
    <LandingClient
      ctaHref={session ? '/workspace' : '/login'}
      githubStars={formatGitHubStarCount(githubStarCount)}
    />
  )
}
