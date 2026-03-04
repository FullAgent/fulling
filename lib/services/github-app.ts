import { App } from '@octokit/app'
import { Octokit } from '@octokit/rest'
import { Webhooks } from '@octokit/webhooks'

import { env } from '@/lib/env'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/services/github-app' })

// ============================================================================
// App Instance (Octokit)
// ============================================================================

let appInstance: App | null = null

function getAppInstance(): App {
  if (!appInstance) {
    if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) {
      throw new Error('GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be configured')
    }

    appInstance = new App({
      appId: env.GITHUB_APP_ID,
      privateKey: resolvePrivateKey(env.GITHUB_APP_PRIVATE_KEY),
    })
  }
  return appInstance
}

// ============================================================================
// Private Key Resolution (Keep for backward compatibility)
// ============================================================================

function resolvePrivateKey(raw: string): string {
  if (!raw || raw.trim() === '') {
    throw new Error('GITHUB_APP_PRIVATE_KEY is empty or not configured')
  }

  // Check if it's already a PEM format
  if (raw.includes('-----BEGIN')) {
    return raw.replace(/\\n/g, '\n')
  }

  // Try base64 decode
  try {
    // Remove any whitespace/newlines from base64 string
    const cleanBase64 = raw.replace(/\s/g, '')
    const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8')
    if (decoded.includes('-----BEGIN')) {
      // Ensure proper line breaks in PEM format
      // PEM format should have lines of 64 characters
      const lines = decoded.split('\n')
      const formattedLines: string[] = []
      for (const line of lines) {
        if (line.startsWith('-----')) {
          formattedLines.push(line)
        } else {
          // Split long lines into 64-character chunks
          for (let i = 0; i < line.length; i += 64) {
            formattedLines.push(line.substring(i, i + 64))
          }
        }
      }
      return formattedLines.join('\n')
    }
    logger.warn('Base64 decoded value does not contain -----BEGIN, using raw value')
  } catch (error) {
    logger.warn(`Failed to decode base64: ${error}`)
  }

  // Fallback: treat as raw key with escaped newlines
  return raw.replace(/\\n/g, '\n')
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const app = getAppInstance()
  const octokit = await app.getInstallationOctokit(installationId)

  // Octokit automatically manages token lifecycle and caching
  const authResult = (await octokit.auth({ type: 'installation' })) as { token: string }

  logger.info(`Installation token retrieved for installation ${installationId}`)
  return authResult.token
}

export async function getInstallationDetails(installationId: number) {
  const app = getAppInstance()
  const octokit = await app.getInstallationOctokit(installationId)

  const { data } = await octokit.request('GET /app/installations/{installation_id}', {
    installation_id: installationId,
  })

  return data
}

export async function listInstallationRepos(installationId: number) {
  const app = getAppInstance()
  const octokit = await app.getInstallationOctokit(installationId)

  const { data } = await octokit.request('GET /installation/repositories', {
    per_page: 100,
  })

  return data.repositories
}

// ============================================================================
// Webhook Verification (Octokit)
// ============================================================================

let webhooksInstance: Webhooks | null = null

function getWebhooksInstance(): Webhooks {
  if (!webhooksInstance) {
    const secret = env.GITHUB_APP_WEBHOOK_SECRET
    if (!secret) {
      throw new Error('GITHUB_APP_WEBHOOK_SECRET is not configured')
    }
    webhooksInstance = new Webhooks({ secret })
  }
  return webhooksInstance
}

export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  try {
    const webhooks = getWebhooksInstance()
    return await webhooks.verify(payload, signature)
  } catch (error) {
    logger.error(`Webhook signature verification failed: ${error}`)
    return false
  }
}

// ============================================================================
// User-level Authentication (OAuth Tokens)
// ============================================================================

interface UserTokenResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: string
  scope: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

/**
 * Exchange OAuth code for user access token + refresh token
 * Called during GitHub App installation callback when OAuth is enabled
 */
export async function exchangeCodeForUserToken(code: string): Promise<UserTokenResponse> {
  if (!env.GITHUB_APP_CLIENT_ID || !env.GITHUB_APP_CLIENT_SECRET) {
    throw new Error('GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET must be configured')
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_APP_CLIENT_ID,
      client_secret: env.GITHUB_APP_CLIENT_SECRET,
      code,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Failed to exchange code for access token: ${response.status} ${errorText}`)
    throw new Error(`Failed to exchange code for access token: ${response.status}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    logger.error({ data }, 'No access_token in OAuth response')
    throw new Error('Failed to exchange code for access token - no token returned')
  }

  const expiresAt = new Date(Date.now() + (data.expires_in || 28800) * 1000).toISOString()
  logger.info('User access token obtained via OAuth code exchange')

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    tokenType: data.token_type || 'bearer',
    scope: data.scope || '',
  }
}

/**
 * Refresh user access token using refresh token
 * Returns new access token + refresh token
 */
export async function refreshUserToken(refreshToken: string): Promise<UserTokenResponse> {
  if (!env.GITHUB_APP_CLIENT_ID || !env.GITHUB_APP_CLIENT_SECRET) {
    throw new Error('GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET must be configured')
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_APP_CLIENT_ID,
      client_secret: env.GITHUB_APP_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Failed to refresh access token: ${response.status} ${errorText}`)
    throw new Error(`Failed to refresh access token: ${response.status}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    logger.error({ data }, 'No access_token in refresh token response')
    throw new Error('Failed to refresh access token - no token returned')
  }

  const expiresAt = new Date(Date.now() + (data.expires_in || 28800) * 1000).toISOString()
  logger.info('User access token refreshed successfully')

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    tokenType: data.token_type || 'bearer',
    scope: data.scope || '',
  }
}

/**
 * Get GitHub user info using access token
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const octokit = new Octokit({ auth: accessToken })
  const { data } = await octokit.request('GET /user')

  return {
    id: data.id,
    login: data.login,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar_url,
  }
}

/**
 * Check if user token needs refresh (proactive refresh 1 hour before expiry)
 */
export function shouldRefreshToken(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  return expiryTime - now < oneHour
}
