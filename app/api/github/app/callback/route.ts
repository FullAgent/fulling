import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { upsertInstallation } from '@/lib/repo/github'
import { getInstallationDetails } from '@/lib/services/github-app'

const logger = baseLogger.child({ module: 'api/github/app/callback' })

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      logger.warn('Unauthenticated user attempted GitHub App callback')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const installationIdStr = searchParams.get('installation_id')
    const setupAction = searchParams.get('setup_action')

    if (!installationIdStr) {
      logger.error('Missing installation_id in GitHub App callback')
      return NextResponse.redirect(new URL('/projects?error=missing_installation_id', request.url))
    }

    const installationId = parseInt(installationIdStr, 10)
    logger.info(`GitHub App callback: installation_id=${installationId}, setup_action=${setupAction}`)

    const details = await getInstallationDetails(installationId)

    if (details.account.type === 'User') {
      const githubIdentity = await prisma.userIdentity.findFirst({
        where: { userId: session.user.id, provider: 'GITHUB' },
      })

      if (!githubIdentity) {
        logger.warn(`User ${session.user.id} has no GitHub identity linked`)
        return NextResponse.redirect(new URL('/projects?error=github_not_linked', request.url))
      }

      const userGitHubId = parseInt(githubIdentity.providerUserId, 10)
      if (details.account.id !== userGitHubId) {
        logger.warn(
          `User ${session.user.id} (GitHub ID ${userGitHubId}) attempted to claim installation for ${details.account.login} (GitHub ID ${details.account.id})`
        )
        return NextResponse.redirect(
          new URL('/projects?error=installation_owner_mismatch', request.url)
        )
      }
    } else {
      logger.warn(`Organization installation not supported yet: ${details.account.login}`)
      return NextResponse.redirect(
        new URL('/projects?error=org_installation_not_supported', request.url)
      )
    }

    await upsertInstallation({
      installationId: details.id,
      userId: session.user.id,
      accountId: details.account.id,
      accountLogin: details.account.login,
      accountType: details.account.type,
      accountAvatarUrl: details.account.avatar_url,
      repositorySelection: details.repository_selection,
      permissions: details.permissions,
      events: details.events,
    })

    logger.info(`GitHub App installed: ${details.account.login}`)

    return NextResponse.redirect(new URL('/projects?github=connected', request.url))
  } catch (error) {
    logger.error(`GitHub App callback error: ${error}`)
    return NextResponse.redirect(new URL('/projects?error=github_callback_failed', request.url))
  }
}
