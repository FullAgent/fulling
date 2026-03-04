import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/user/github/bind' })

/**
 * GET /api/user/github/bind
 * Initiates the GitHub OAuth flow for binding
 * Redirects to GitHub authorization page with a secure state parameter
 *
 * @deprecated This endpoint is deprecated in favor of GitHub App OAuth flow.
 * Will be removed in v0.5.0. Use GitHub App installation flow instead.
 */
export async function GET() {
  logger.warn('DEPRECATED: /api/user/github/bind called - use GitHub App OAuth flow instead')

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      logger.error('GitHub OAuth is not configured')
      return NextResponse.json({ error: 'GitHub OAuth is not configured' }, { status: 500 })
    }

    // Generate a secure random state parameter
    const state = randomBytes(32).toString('hex')

    // Store state in a cookie for verification in callback
    // Format: state|userId|timestamp
    const stateData = `${state}|${session.user.id}|${Date.now()}`
    const encodedState = Buffer.from(stateData).toString('base64')

    // Build GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
    githubAuthUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/github/callback`)
    githubAuthUrl.searchParams.set('scope', 'repo read:user')
    githubAuthUrl.searchParams.set('state', encodedState)

    logger.info(`GitHub OAuth bind initiated for user ${session.user.id}`)

    // Create response with redirect
    const response = NextResponse.redirect(githubAuthUrl.toString())

    // Set state cookie (expires in 10 minutes)
    response.cookies.set('github_oauth_state', encodedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    logger.error(`Error initiating GitHub OAuth bind: ${error}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
