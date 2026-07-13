import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from './config'

export interface AppSession {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401

  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export async function getSession(): Promise<AppSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return null
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    },
  }
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

export async function requireApiSession(): Promise<AppSession> {
  const session = await getSession()

  if (!session) {
    throw new UnauthorizedError()
  }

  return session
}
