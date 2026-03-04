import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/auth/github/callback' })

/**
 * GET /api/auth/github/callback
 * Handles the OAuth callback from GitHub for account binding
 *
 * @deprecated This endpoint is deprecated in favor of GitHub App OAuth flow.
 * Will be removed in v0.5.0. Use GitHub App installation flow instead.
 */
export async function GET(request: NextRequest) {
  logger.warn('DEPRECATED: /api/auth/github/callback called - use GitHub App OAuth flow instead')

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 })
    }

    // Verify state parameter
    const stateCookie = request.cookies.get('github_oauth_state')?.value

    if (!stateCookie || stateCookie !== state) {
      logger.warn('State mismatch in GitHub OAuth callback')
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }

    // Decode state to get userId
    let userId: string
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8')
      const [, extractedUserId, timestamp] = decodedState.split('|')

      // Check if state is expired (10 minutes)
      const stateAge = Date.now() - parseInt(timestamp, 10)
      if (stateAge > 10 * 60 * 1000) {
        return NextResponse.json({ error: 'State expired' }, { status: 400 })
      }

      userId = extractedUserId
    } catch {
      return NextResponse.json({ error: 'Invalid state format' }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      logger.error('Failed to get access token from GitHub')
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
    }

    const accessToken = tokenData.access_token
    const scope = tokenData.scope || 'repo read:user'

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    const githubUser = await userResponse.json()

    if (!githubUser.id) {
      logger.error('Failed to get GitHub user info')
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 })
    }

    const githubUserId = githubUser.id.toString()
    const githubLogin = githubUser.login
    const githubAvatarUrl = githubUser.avatar_url

    // Check if this GitHub account is already bound to another user
    const existingIdentity = await prisma.userIdentity.findUnique({
      where: {
        unique_provider_user: {
          provider: 'GITHUB',
          providerUserId: githubUserId,
        },
      },
    })

    if (existingIdentity && existingIdentity.userId !== userId) {
      logger.warn(`GitHub account ${githubLogin} is already bound to another user`)
      return createCallbackPage(
        false,
        'This GitHub account is already bound to another user account.'
      )
    }

    // Upsert GitHub identity
    await prisma.userIdentity.upsert({
      where: {
        unique_provider_user: {
          provider: 'GITHUB',
          providerUserId: githubUserId,
        },
      },
      update: {
        metadata: {
          token: accessToken,
          scope,
          login: githubLogin,
          avatar_url: githubAvatarUrl,
        },
      },
      create: {
        userId,
        provider: 'GITHUB',
        providerUserId: githubUserId,
        metadata: {
          token: accessToken,
          scope,
          login: githubLogin,
          avatar_url: githubAvatarUrl,
        },
        isPrimary: false, // This is a binding, not primary login
      },
    })

    logger.info(`GitHub account ${githubLogin} bound successfully for user ${userId}`)

    // Return success page that notifies parent window
    return createCallbackPage(true, 'GitHub account connected successfully!')
  } catch (error) {
    logger.error(`Error in GitHub OAuth callback: ${error}`)
    return createCallbackPage(false, 'An error occurred during GitHub authentication.')
  }
}

/**
 * Create an HTML page that sends a message to the parent window (popup opener)
 * and closes itself
 */
function createCallbackPage(success: boolean, message: string): NextResponse {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GitHub Authentication</title>
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
        { type: 'github-oauth-callback', success: ${success}, message: '${message}' },
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
