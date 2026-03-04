import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/user/github' })

/**
 * GET /api/user/github
 * Returns the GitHub binding status for the current user
 *
 * @deprecated This endpoint is deprecated in favor of GitHub App OAuth flow.
 * Will be removed in v0.5.0. Use GitHub App installation flow instead.
 */
export async function GET() {
  logger.warn('DEPRECATED: /api/user/github GET called - use GitHub App OAuth flow instead')

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find GitHub identity for this user
    const githubIdentity = await prisma.userIdentity.findFirst({
      where: {
        userId: session.user.id,
        provider: 'GITHUB',
      },
    })

    if (!githubIdentity) {
      return NextResponse.json({ connected: false })
    }

    // Extract GitHub info from metadata
    const metadata = githubIdentity.metadata as {
      login?: string
      avatar_url?: string
    }

    return NextResponse.json({
      connected: true,
      login: metadata.login,
      avatar_url: metadata.avatar_url,
    })
  } catch (error) {
    logger.error(`Error fetching GitHub status: ${error}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/github
 * Unbinds the GitHub account from the current user
 *
 * @deprecated This endpoint is deprecated in favor of GitHub App OAuth flow.
 * Will be removed in v0.5.0. Use GitHub App installation flow instead.
 */
export async function DELETE() {
  logger.warn('DEPRECATED: /api/user/github DELETE called - use GitHub App OAuth flow instead')

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find and delete GitHub identity
    const githubIdentity = await prisma.userIdentity.findFirst({
      where: {
        userId: session.user.id,
        provider: 'GITHUB',
      },
    })

    if (!githubIdentity) {
      return NextResponse.json({ error: 'No GitHub account connected' }, { status: 404 })
    }

    // Check if this is the primary (and only) identity
    const identityCount = await prisma.userIdentity.count({
      where: {
        userId: session.user.id,
      },
    })

    if (identityCount === 1 && githubIdentity.isPrimary) {
      return NextResponse.json(
        {
          error: 'Cannot unbind the only login method. Please add another login method first.',
        },
        { status: 400 }
      )
    }

    // Delete the GitHub identity
    await prisma.userIdentity.delete({
      where: {
        id: githubIdentity.id,
      },
    })

    logger.info(`GitHub account unbound for user ${session.user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`Error unbinding GitHub account: ${error}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
