import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { upsertInstallation } from '@/lib/repo/github'
import {
  exchangeCodeForUserToken,
  getGitHubUser,
  getInstallationDetails,
} from '@/lib/services/github-app'

const logger = baseLogger.child({ module: 'api/github/app/callback' })

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      logger.warn('Unauthenticated user attempted GitHub App callback')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const installationIdStr = searchParams.get('installation_id')
    const setupAction = searchParams.get('setup_action')
    const code = searchParams.get('code') // NEW: OAuth code

    if (!installationIdStr) {
      logger.error('Missing installation_id in GitHub App callback')
      return NextResponse.json({ error: 'Missing installation_id' }, { status: 400 })
    }

    const installationId = parseInt(installationIdStr, 10)
    logger.info(
      `GitHub App callback: installation_id=${installationId}, setup_action=${setupAction}, has_code=${!!code}`
    )

    // ========================================================================
    // Handle OAuth code exchange (if present)
    // ========================================================================
    let oauthSucceeded = false
    if (code) {
      try {
        // Exchange code for user tokens
        const tokenResponse = await exchangeCodeForUserToken(code)

        // Get user info with access token
        const githubUser = await getGitHubUser(tokenResponse.accessToken)

        // Create/update UserIdentity with new metadata structure
        await prisma.userIdentity.upsert({
          where: {
            unique_provider_user: {
              provider: 'GITHUB',
              providerUserId: githubUser.id.toString(),
            },
          },
          create: {
            userId: session.user.id,
            provider: 'GITHUB',
            providerUserId: githubUser.id.toString(),
            metadata: {
              accessToken: tokenResponse.accessToken,
              refreshToken: tokenResponse.refreshToken,
              expiresAt: tokenResponse.expiresAt,
              tokenType: tokenResponse.tokenType,
              scope: tokenResponse.scope,
              login: githubUser.login,
              name: githubUser.name,
              avatarUrl: githubUser.avatar_url,
              email: githubUser.email,
              githubId: githubUser.id,
            },
            isPrimary: false,
          },
          update: {
            metadata: {
              accessToken: tokenResponse.accessToken,
              refreshToken: tokenResponse.refreshToken,
              expiresAt: tokenResponse.expiresAt,
              tokenType: tokenResponse.tokenType,
              scope: tokenResponse.scope,
              login: githubUser.login,
              name: githubUser.name,
              avatarUrl: githubUser.avatar_url,
              email: githubUser.email,
              githubId: githubUser.id,
            },
          },
        })

        logger.info(
          `GitHub identity created/updated for user ${session.user.id} (GitHub ID: ${githubUser.id})`
        )
        oauthSucceeded = true
      } catch (error) {
        logger.error(`OAuth token exchange failed: ${error}`)
        // Continue to installation creation even if OAuth fails (graceful degradation)
      }
    }

    const details = await getInstallationDetails(installationId)

    // Ownership validation (skip if OAuth succeeded, as it already validated the user)
    if (!oauthSucceeded) {
      if (details.account && 'type' in details.account && details.account.type === 'User') {
        const githubIdentity = await prisma.userIdentity.findFirst({
          where: { userId: session.user.id, provider: 'GITHUB' },
        })

        if (!githubIdentity) {
          logger.warn(`User ${session.user.id} has no GitHub identity linked`)
          return NextResponse.json({ error: 'GitHub account not linked' }, { status: 400 })
        }

        const userGitHubId = parseInt(githubIdentity.providerUserId, 10)
        if (details.account.id !== userGitHubId) {
          logger.warn(
            `User ${session.user.id} (GitHub ID ${userGitHubId}) attempted to claim installation for ${details.account.login} (GitHub ID ${details.account.id})`
          )
          return NextResponse.json({ error: 'Installation owner mismatch' }, { status: 403 })
        }
      } else if (details.account && 'type' in details.account) {
        logger.warn(`Organization installation not supported yet: ${details.account.login}`)
        return NextResponse.json({ error: 'Organization installation not supported' }, { status: 400 })
      }
    }

    await upsertInstallation({
      installationId: details.id,
      userId: session.user.id,
      accountId: details.account?.id ?? 0,
      accountLogin: ('login' in (details.account ?? {}) ? (details.account as any).login : (details.account as any)?.name) ?? 'unknown',
      accountType: ('type' in (details.account ?? {}) ? (details.account as any).type : 'Unknown'),
      accountAvatarUrl: details.account?.avatar_url ?? null,
      repositorySelection: details.repository_selection,
      permissions: details.permissions,
      events: details.events,
    })

    const accountName = 'login' in (details.account ?? {}) ? (details.account as any).login : (details.account as any)?.name ?? 'unknown'
    logger.info(`GitHub App installed: ${accountName}`)

    return createCallbackPage(true, 'GitHub App installed successfully!')
  } catch (error) {
    logger.error(`GitHub App callback error: ${error}`)
    return createCallbackPage(false, 'Failed to install GitHub App. Please try again.')
  }
}

function createCallbackPage(success: boolean, message: string): NextResponse {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GitHub App Installation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: ${success ? '#f0fdf4' : '#fef2f2'};
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .message {
      font-size: 1.125rem;
      color: ${success ? '#166534' : '#991b1b'};
      margin-bottom: 1rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <div class="message">${message}</div>
    <div class="subtitle">This window will close automatically...</div>
  </div>
  <script>
    // Notify parent window
    if (window.opener) {
      window.opener.postMessage(
        { type: 'github-app-installed', success: ${success}, message: '${message}' },
        window.location.origin
      );
    }
    
    // Close window after a short delay
    setTimeout(() => {
      window.close();
    }, 1500);
  </script>
</body>
</html>
  `

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
