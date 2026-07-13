import { getSession } from '@/lib/auth/session'

import { LandingClient } from './_components/landing-client'

export default async function LandingPage() {
  const session = await getSession()

  return <LandingClient ctaHref={session ? '/workspace' : '/login'} />
}
