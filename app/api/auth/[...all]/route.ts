import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

const unavailable = () =>
  Response.json(
    { code: 'AUTH_UNAVAILABLE', message: 'Authentication is not configured.' },
    { status: 503 }
  )

const handlers = auth ? toNextJsHandler(auth) : null

export const GET = handlers?.GET ?? unavailable
export const POST = handlers?.POST ?? unavailable
